"use client"

import { useState } from "react"
import { Loader2, MailCheck } from "lucide-react"
import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

/**
 * Asks for a reset link. The confirmation is the same whether or not the
 * address has an account, so this can't be used to find out who's signed up.
 */
export function ForgotPasswordForm() {
  const [email, setEmail] = useState("")
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!email.trim()) return
    setSubmitting(true)
    setError(null)
    const { error } = await authClient.requestPasswordReset({
      email: email.trim(),
      redirectTo: "/reset-password",
    })
    setSubmitting(false)
    if (error) {
      setError(
        error.status === 429
          ? "Too many requests. Wait a minute and try again."
          : "We couldn't send the link. Check the address and try again.",
      )
      return
    }
    setSent(true)
  }

  if (sent) {
    return (
      <div className="grid gap-3 rounded-xl border bg-surface p-4 text-sm" role="status">
        <MailCheck className="h-6 w-6 text-primary" />
        <p className="font-medium">Check your email</p>
        <p className="text-muted-foreground">
          If an account uses <span className="font-medium text-foreground">{email.trim()}</span>, we&apos;ve
          sent it a link to choose a new password. The link works once and expires in 1 hour. Check your
          spam folder if it doesn&apos;t arrive in a few minutes.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      <div className="grid gap-2">
        <label htmlFor="forgot-email" className="text-sm font-medium">
          Email
        </label>
        <Input
          id="forgot-email"
          name="email"
          type="email"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          required
          value={email}
          onChange={e => setEmail(e.target.value)}
          disabled={submitting}
          className="h-11 rounded-xl"
        />
      </div>
      {error && (
        <p role="alert" className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}
      <Button type="submit" size="lg" disabled={submitting || !email.trim()} className="w-full">
        {submitting && <Loader2 className="animate-spin" />}
        Send reset link
      </Button>
    </form>
  )
}
