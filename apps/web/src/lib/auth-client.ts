import { createAuthClient as createBetterAuthClient } from "better-auth/react";
import { env as clientEnv } from "@/data/env/client";

export const authClient = createBetterAuthClient({
  baseURL: clientEnv.NEXT_PUBLIC_BETTER_AUTH_URL,
});

export const { signIn, signOut, signUp, useSession } = authClient;

export type SignIn = typeof authClient.signIn;
export type SignOut = typeof authClient.signOut;
