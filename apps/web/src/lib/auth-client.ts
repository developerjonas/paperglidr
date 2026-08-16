import { createAuthClient as createBetterAuthClient } from "better-auth/react";

export const authClient = createBetterAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:3001",
});

export const { signIn, signOut, signUp, useSession } = authClient;

export type SignIn = typeof authClient.signIn;
export type SignOut = typeof authClient.signOut;
