"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { AtSign, Loader2 } from "lucide-react"
import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { NewPasswordField } from "@/components/auth/NewPasswordField"
import {
  USERNAME_MAX_LENGTH,
  USERNAME_MIN_LENGTH,
  USERNAME_PATTERN,
  checkPassword,
} from "@repo/password-policy"

type UsernameState = "idle" | "checking" | "available" | "taken"

function usernameProblem(username: string) {
  if (username.length === 0) return null
  if (!USERNAME_PATTERN.test(username)) return "Letters, numbers, dots and underscores only."
  if (username.length < USERNAME_MIN_LENGTH) return `At least ${USERNAME_MIN_LENGTH} characters.`
  if (username.length > USERNAME_MAX_LENGTH) return `At most ${USERNAME_MAX_LENGTH} characters.`
  return null
}

/**
 * Email sign-up: name, username, email and a password that must pass
 * lib/passwordPolicy.ts. The server (lib/auth.ts) enforces the same rules
 * and also rejects breached passwords.
 */
export function SignUpForm({ redirectTo }: { redirectTo: string }) {
  const router = useRouter()
  const [name, setName] = useState("")
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [usernameState, setUsernameState] = useState<UsernameState>("idle")
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const usernameError = usernameProblem(username)
  const passwordOk = checkPassword(password, { name, email, username }).ok
  const canSubmit =
    name.trim().length >= 2 &&
    username.length > 0 &&
    usernameError == null &&
    usernameState !== "taken" &&
    email.length > 0 &&
    passwordOk &&
    !submitting

  async function checkUsername() {
    if (username.length === 0 || usernameError != null) return
    setUsernameState("checking")
    const { data } = await authClient.isUsernameAvailable({ username })
    setUsernameState(data == null ? "idle" : data.available ? "available" : "taken")
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!canSubmit) return
    setSubmitting(true)
    setError(null)
    const { error } = await authClient.signUp.email({
      name: name.trim(),
      email: email.trim(),
      username,
      displayUsername: username,
      password,
      callbackURL: redirectTo,
    })
    if (error) {
      setError(error.message ?? "Couldn't create your account. Please try again.")
      if (error.code === "USERNAME_IS_ALREADY_TAKEN") setUsernameState("taken")
      setSubmitting(false)
      return
    }
    router.push(redirectTo)
    router.refresh()
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4" noValidate>
      <div className="grid gap-2">
        <label htmlFor="signup-name" className="text-sm font-medium">
          Full name
        </label>
        <Input
          id="signup-name"
          name="name"
          autoComplete="name"
          required
          maxLength={100}
          value={name}
          onChange={e => setName(e.target.value)}
          disabled={submitting}
          className="h-11 rounded-xl"
        />
      </div>

      <div className="grid gap-2">
        <label htmlFor="signup-username" className="text-sm font-medium">
          Username
        </label>
        <div className="relative">
          <AtSign className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="signup-username"
            name="username"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            required
            maxLength={USERNAME_MAX_LENGTH}
            value={username}
            onChange={e => {
              setUsername(e.target.value.trim())
              setUsernameState("idle")
            }}
            onBlur={checkUsername}
            disabled={submitting}
            aria-invalid={usernameError != null || usernameState === "taken"}
            aria-describedby="signup-username-hint"
            className="h-11 rounded-xl pl-9"
          />
        </div>
        <p id="signup-username-hint" className="text-xs text-muted-foreground" aria-live="polite">
          {usernameError ? (
            <span className="text-destructive">{usernameError}</span>
          ) : usernameState === "taken" ? (
            <span className="text-destructive">That username is taken.</span>
          ) : usernameState === "available" ? (
            <span className="text-success">Available.</span>
          ) : usernameState === "checking" ? (
            "Checking…"
          ) : (
            "You can sign in with this or your email."
          )}
        </p>
      </div>

      <div className="grid gap-2">
        <label htmlFor="signup-email" className="text-sm font-medium">
          Email
        </label>
        <Input
          id="signup-email"
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

      <NewPasswordField
        value={password}
        onChange={setPassword}
        context={{ name, email, username }}
        disabled={submitting}
      />

      {error && (
        <p role="alert" className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <Button type="submit" size="lg" disabled={!canSubmit} className="w-full">
        {submitting && <Loader2 className="animate-spin" />}
        Create account
      </Button>
    </form>
  )
}
