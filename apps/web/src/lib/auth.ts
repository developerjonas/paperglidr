// apps/web/src/lib/auth.ts
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { bearer, haveIBeenPwned, username } from "better-auth/plugins";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { db } from "@/drizzle/db";
import * as schema from "@/drizzle/schema";
import z from "zod";
import { env } from "@/data/env/server";
import {
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  USERNAME_MAX_LENGTH,
  USERNAME_MIN_LENGTH,
  USERNAME_PATTERN,
  checkPassword,
} from "@/lib/passwordPolicy";

const trustedOrigins = (env.BETTER_AUTH_TRUSTED_ORIGINS ?? "")
  .split(",")
  .map(origin => origin.trim())
  .filter(Boolean);

export const auth = betterAuth({
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  emailAndPassword: {
    enabled: true,
    minPasswordLength: PASSWORD_MIN_LENGTH,
    maxPasswordLength: PASSWORD_MAX_LENGTH,
    // requireEmailVerification: true,  // optional — your schema has emailVerified, so this is available if you want it
  },
  // The full password rules (lib/passwordPolicy.ts) on every route that sets
  // a password, and a username on every email sign-up. The form checks the
  // same rules live; this is what actually enforces them.
  hooks: {
    before: createAuthMiddleware(async ctx => {
      if (ctx.path === "/sign-up/email") {
        const body = ctx.body as { name?: string; email?: string; username?: string; password?: string };
        if ((body.name ?? "").trim().length < 2) {
          throw new APIError("BAD_REQUEST", { message: "Enter your name." });
        }
        if (!body.username?.trim()) {
          throw new APIError("BAD_REQUEST", { message: "Choose a username." });
        }
        rejectWeakPassword(body.password, body);
      } else if (ctx.path === "/change-password" || ctx.path === "/reset-password") {
        rejectWeakPassword((ctx.body as { newPassword?: string }).newPassword, {});
      }
    }),
  },
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: schema,
  }),
  advanced: {
    database: {
      generateId: "uuid",
    },
    // Only share the session cookie across subdomains when a parent domain
    // is configured; otherwise the cookie stays host-only.
    ...(env.AUTH_COOKIE_DOMAIN
      ? {
          crossSubDomainCookies: {
            enabled: true,
            domain: env.AUTH_COOKIE_DOMAIN,
          },
        }
      : {}),
  },
  trustedOrigins,
  socialProviders: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    },
    // Optional provider — only registered when both credentials are set
    ...(env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET
      ? {
          github: {
            clientId: env.GITHUB_CLIENT_ID,
            clientSecret: env.GITHUB_CLIENT_SECRET,
          },
        }
      : {}),
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        input: false,
        validator: {
          input: z.enum(["user", "admin"]),
        },
      },
    },
  },
  rateLimit: {
    enabled: true,
    window: 60,
    max: 20,
    storage: "memory",
    customRules: {
      "/sign-in/email": { window: 60, max: 5 },
      "/sign-in/username": { window: 60, max: 5 },
      "/sign-up/email": { window: 60, max: 5 },
      "/sign-in/social": { window: 60, max: 5 },
      "/callback/google": { window: 60, max: 5 },
      "/callback/github": { window: 60, max: 5 },
      "/get-session": { window: 60, max: 100 },
    },
  },
  plugins: [
    username({
      minUsernameLength: USERNAME_MIN_LENGTH,
      maxUsernameLength: USERNAME_MAX_LENGTH,
      usernameValidator: value => USERNAME_PATTERN.test(value),
    }),
    // Rejects passwords found in known breaches. Only the first 5 characters
    // of the password's SHA-1 hash leave the server (k-anonymity range API).
    haveIBeenPwned({
      customPasswordCompromisedMessage:
        "This password has appeared in a data breach. Choose a different one — a password manager can generate one for you.",
    }),
    bearer(),
    // Must stay last: it forwards cookies set by the plugins above.
    nextCookies(),
  ],
});
export type Auth = typeof auth;
export type Session = typeof auth.$Infer.Session;

function rejectWeakPassword(
  password: string | undefined,
  context: { name?: string; email?: string; username?: string },
) {
  const result = checkPassword(password ?? "", context);
  if (!result.ok) {
    throw new APIError("BAD_REQUEST", {
      message: `Choose a stronger password: ${result.firstFailure}.`,
    });
  }
}
