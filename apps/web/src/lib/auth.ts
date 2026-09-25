// apps/web/src/lib/auth.ts
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { bearer, haveIBeenPwned, username } from "better-auth/plugins";
import { APIError, createAuthMiddleware, getSessionFromCtx } from "better-auth/api";
import { sendNotification } from "@/services/email/notifications";
import { SITE_NAME } from "@/lib/site";
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
} from "@repo/password-policy";

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
    // Forgot password: a single-use link, valid for an hour. Sending is best
    // effort (sendNotification logs failures), so the response is the same
    // whether or not the address has an account.
    resetPasswordTokenExpiresIn: 60 * 60,
    sendResetPassword: async ({ user, url }) => {
      await sendNotification({
        to: user.email,
        subject: `Reset your ${SITE_NAME} password`,
        paragraphs: [
          `Hi ${user.name},`,
          `Someone asked to reset the password for your ${SITE_NAME} account. If it was you, choose a new password with the link below. It works once and expires in 1 hour.`,
          "If you didn't ask for this, ignore this email — your password stays the same.",
        ],
        link: { href: url, label: "Choose a new password" },
      });
    },
    // A reset signs out every device, and the owner is told it happened.
    revokeSessionsOnPasswordReset: true,
    onPasswordReset: async ({ user }) => {
      await sendNotification({
        to: user.email,
        subject: `Your ${SITE_NAME} password was changed`,
        paragraphs: [
          `Hi ${user.name},`,
          `The password for your ${SITE_NAME} account was just reset, and every device was signed out.`,
          `If this wasn't you, reset your password again right away and contact support.`,
        ],
      });
    },
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
      } else if (ctx.path === "/reset-password" || ctx.path === "/change-password") {
        const newPassword = (ctx.body as { newPassword?: string }).newPassword;
        const userId = await passwordChangeUserId(ctx);
        // No user = an invalid token or no session; Better Auth rejects that itself.
        if (userId == null) return;
        const user = await ctx.context.internalAdapter.findUserById(userId);
        rejectWeakPassword(newPassword, {
          name: user?.name,
          email: user?.email,
          username: (user as { username?: string | null } | null)?.username ?? undefined,
        });
        await rejectCurrentPassword(ctx, userId, newPassword);
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
      "/request-password-reset": { window: 60, max: 3 },
      "/reset-password": { window: 60, max: 5 },
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

type AuthHookContext = Parameters<Parameters<typeof createAuthMiddleware>[0]>[0];

/** Whose password a reset (by token) or change (by session) is about to set. */
async function passwordChangeUserId(ctx: AuthHookContext) {
  if (ctx.path === "/change-password") {
    return (await getSessionFromCtx(ctx))?.user.id ?? null;
  }
  const token =
    (ctx.body as { token?: string }).token ?? (ctx.query as { token?: string } | undefined)?.token;
  if (!token) return null;
  // Read without consuming: the reset endpoint consumes it after this hook.
  const verification = await ctx.context.internalAdapter.findVerificationValue(`reset-password:${token}`);
  if (verification == null || verification.expiresAt < new Date()) return null;
  return verification.value;
}

/** The new password can't be the one the account has now. */
async function rejectCurrentPassword(ctx: AuthHookContext, userId: string, newPassword: string | undefined) {
  if (!newPassword) return;
  const accounts = await ctx.context.internalAdapter.findAccounts(userId);
  const hash = accounts.find(account => account.providerId === "credential")?.password;
  if (hash && (await ctx.context.password.verify({ hash, password: newPassword }))) {
    throw new APIError("BAD_REQUEST", {
      message: "Your new password can't be the same as your current one. Choose a different password.",
    });
  }
}
