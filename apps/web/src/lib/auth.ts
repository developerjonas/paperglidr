// apps/web/src/lib/auth.ts
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { bearer } from "better-auth/plugins";
import { db } from "@/drizzle/db";
import * as schema from "@/drizzle/schema";
import z from "zod";

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL!,
  emailAndPassword: {
    enabled: true,
    // requireEmailVerification: true,  // optional — your schema has emailVerified, so this is available if you want it
  },
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: schema,
  }),
  advanced: {
    database: {
      generateId: "uuid",
    },
    crossSubDomainCookies: {
      enabled: process.env.NODE_ENV === "production",
      domain: ".paperglidr.com",
    },
  },
  trustedOrigins: [
    "paperglidr://",
    "https://paperglidr.com",
    "https://www.paperglidr.com",
    "https://app.paperglidr.com",
  ],
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID as string,
      clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
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
      "/sign-in/social": { window: 60, max: 5 },
      "/callback/google": { window: 60, max: 5 },
      "/callback/github": { window: 60, max: 5 },
      "/get-session": { window: 60, max: 100 },
    },
  },
  plugins: [nextCookies(), bearer()],
});
export type Auth = typeof auth;
export type Session = typeof auth.$Infer.Session;
