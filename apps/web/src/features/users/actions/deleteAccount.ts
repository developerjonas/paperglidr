"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { getCurrentUser } from "@/services/auth"
import { deleteAccount } from "../lib/deleteAccount"

// Better Auth's session cookies (same names middleware.ts checks).
const SESSION_COOKIES = [
  "__Secure-better-auth.session_token",
  "better-auth.session_token",
  "__Secure-better-auth-session_token",
  "better-auth-session_token",
]

/**
 * Deletes the signed-in user's account (see lib/deleteAccount.ts) and
 * lands on /account-deleted: a public page, since every /account page
 * now needs a sign-in.
 */
export async function deleteMyAccount(confirmation: string) {
  const { userId } = await getCurrentUser()
  if (userId == null) return { error: true, message: "Sign in to continue." }

  const result = await deleteAccount({ userId, confirmation: String(confirmation ?? "") })
  if (!result.ok) return { error: true, message: result.message }

  // The sessions are already gone from the database; drop the cookie too.
  const jar = await cookies()
  for (const name of SESSION_COOKIES) jar.delete(name)
  redirect("/account-deleted")
}
