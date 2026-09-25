"use client"

import { useState } from "react"
import Link from "next/link"
import { CheckCircle2, Loader2 } from "lucide-react"
import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { NewPasswordField } from "@/components/auth/NewPasswordField"
import { checkPassword } from "@repo/password-policy"

/**
 * Sets a new password from an emailed reset link. The server also checks
 * the rules against the account's name, username and email, rejects
 * breached passwords and the current password, and signs out every device.
 */
export function ResetPasswordForm({ token }: { token: string }) {
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const passwordOk = checkPassword(password).ok

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!passwordOk) return
    setSubmitting(true)
    setError(null)
    const { error } = await authClient.resetPassword({ newPassword: password, token })
    setSubmitting(false)
    if (error) {
      setError(
        error.code === "INVALID_TOKEN"
          ? "This reset link has expired or was already used. Ask for a new one."
          : (error.message ?? "Couldn't change your password. Please try again."),
      )
      return
    }
    setDone(true)
  }

  if (done) {
    return (
      <div className="grid gap-4" role="status">
        <div className="grid gap-2 rounded-xl border bg-surface p-4 text-sm">
          <CheckCircle2 className="h-6 w-6 text-success" />
          <p className="font-medium">Password changed</p>
          <p className="text-muted-foreground">
            Every device was signed out. Sign in with your new password — and make sure your password
            manager saved it.
          </p>
        </div>
        <Button asChild size="lg" className="w-full">
          <Link href="/sign-in">Sign in</Link>
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      {/* Lets password managers attach the new password to the right account. */}
      <input type="text" name="username" autoComplete="username" hidden readOnly />
      <NewPasswordField
        label="New password"
        value={password}
        onChange={setPassword}
        context={{}}
        disabled={submitting}
      />
      <p className="text-xs text-muted-foreground">It can&apos;t be the same as your current password.</p>
      {error && (
        <p role="alert" className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}
      <Button type="submit" size="lg" disabled={submitting || !passwordOk} className="w-full">
        {submitting && <Loader2 className="animate-spin" />}
        Change password
      </Button>
    </form>
  )
}
