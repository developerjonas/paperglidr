// apps/web/src/lib/auth.ts
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/drizzle/db";
import * as schema from "@/drizzle/schema";

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
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
    ...(process.env.NODE_ENV === "production"
      ? ["https://paperglidr.com", "https://www.paperglidr.com"]
      : [
          "http://localhost:3000",
          "http://localhost:3001",
        ]),
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
  plugins: [nextCookies()],
});

export type Auth = typeof auth;
export type Session = typeof auth.$Infer.Session;
