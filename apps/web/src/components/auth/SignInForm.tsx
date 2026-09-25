"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

/**
 * Email-or-username sign-in. The autocomplete attributes let the browser
 * or password manager fill both fields.
 */
export function SignInForm({ redirectTo }: { redirectTo: string }) {
  const router = useRouter()
  const [identifier, setIdentifier] = useState("")
  const [password, setPassword] = useState("")
  const [visible, setVisible] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const id = identifier.trim()
    if (!id || !password) return
    setSubmitting(true)
    setError(null)

    const { error } = id.includes("@")
      ? await authClient.signIn.email({ email: id, password, callbackURL: redirectTo })
      : await authClient.signIn.username({ username: id, password })

    if (error) {
      // One message for both a wrong identifier and a wrong password.
      setError(
        error.status === 429
          ? "Too many attempts. Wait a minute and try again."
          : "That email/username and password don't match.",
      )
      setSubmitting(false)
      return
    }
    router.push(redirectTo)
    router.refresh()
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      <div className="grid gap-2">
        <label htmlFor="signin-identifier" className="text-sm font-medium">
          Email or username
        </label>
        <Input
          id="signin-identifier"
          name="username"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          required
          value={identifier}
          onChange={e => setIdentifier(e.target.value)}
          disabled={submitting}
          className="h-11 rounded-xl"
        />
      </div>

      <div className="grid gap-2">
        <label htmlFor="signin-password" className="text-sm font-medium">
          Password
        </label>
        <div className="relative">
          <Input
            id="signin-password"
            name="password"
            type={visible ? "text" : "password"}
            autoComplete="current-password"
            required
            value={password}
            onChange={e => setPassword(e.target.value)}
            disabled={submitting}
            className="h-11 rounded-xl pr-11"
          />
          <button
            type="button"
            onClick={() => setVisible(v => !v)}
            aria-label={visible ? "Hide password" : "Show password"}
            className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {error && (
        <p role="alert" className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <Button type="submit" size="lg" disabled={submitting || !identifier.trim() || !password} className="w-full">
        {submitting && <Loader2 className="animate-spin" />}
        Sign in
      </Button>
    </form>
  )
}
