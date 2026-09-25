import { createAuthClient as createBetterAuthClient } from "better-auth/react";
import { usernameClient } from "better-auth/client/plugins";
import { env as clientEnv } from "@/data/env/client";

export const authClient = createBetterAuthClient({
  baseURL: clientEnv.NEXT_PUBLIC_BETTER_AUTH_URL,
  plugins: [usernameClient()],
});

export const { signIn, signOut, signUp, useSession } = authClient;

export type SignIn = typeof authClient.signIn;
export type SignOut = typeof authClient.signOut;
