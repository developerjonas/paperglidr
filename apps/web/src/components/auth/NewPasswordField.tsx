"use client"

import { useId, useState } from "react"
import { Check, Copy, Eye, EyeOff, KeyRound, Sparkles, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import {
  PASSWORD_MAX_LENGTH,
  PASSWORD_RULES_ATTRIBUTE,
  checkPassword,
  generateStrongPassword,
  type PasswordContext,
} from "@/lib/passwordPolicy"

const STRENGTH = [
  { label: "Too weak", bar: "bg-destructive" },
  { label: "Too weak", bar: "bg-destructive" },
  { label: "Almost there", bar: "bg-amber-500" },
  { label: "Strong", bar: "bg-success" },
  { label: "Very strong", bar: "bg-success" },
] as const

/**
 * The password input for sign-up: live rules, a strength meter and a
 * generator. `autoComplete="new-password"` plus Safari's `passwordrules`
 * make browsers and password managers offer (and save) a password that
 * already meets the rules.
 */
export function NewPasswordField({
  value,
  onChange,
  context,
  disabled,
}: {
  value: string
  onChange: (value: string) => void
  context: PasswordContext
  disabled?: boolean
}) {
  const id = useId()
  const [visible, setVisible] = useState(false)
  const [generated, setGenerated] = useState(false)
  const [copied, setCopied] = useState(false)
  const result = checkPassword(value, context)
  const strength = STRENGTH[result.score]!

  function suggest() {
    onChange(generateStrongPassword(20, context))
    setGenerated(true)
    setVisible(true)
    setCopied(false)
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={id} className="text-sm font-medium">
          Password
        </label>
        <button
          type="button"
          onClick={suggest}
          disabled={disabled}
          className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline disabled:opacity-50"
        >
          <Sparkles className="h-3.5 w-3.5" /> Suggest a strong password
        </button>
      </div>

      <div className="relative">
        <Input
          id={id}
          name="new-password"
          type={visible ? "text" : "password"}
          autoComplete="new-password"
          // Safari / iCloud Keychain generate to these rules.
          {...{ passwordrules: PASSWORD_RULES_ATTRIBUTE }}
          maxLength={PASSWORD_MAX_LENGTH}
          required
          disabled={disabled}
          value={value}
          onChange={event => {
            onChange(event.target.value)
            setGenerated(false)
          }}
          aria-describedby={`${id}-rules ${id}-manager`}
          aria-invalid={value.length > 0 && !result.ok}
          className={cn("h-11 rounded-xl pr-11 font-mono text-[15px]", !visible && "tracking-wider")}
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

      {value.length > 0 && (
        <div className="flex items-center gap-3" aria-live="polite">
          <div className="grid flex-1 grid-cols-4 gap-1">
            {[1, 2, 3, 4].map(step => (
              <span
                key={step}
                className={cn("h-1.5 rounded-full bg-secondary", result.score >= step && strength.bar)}
              />
            ))}
          </div>
          <span className="w-24 text-right text-xs font-medium text-muted-foreground">{strength.label}</span>
        </div>
      )}

      <ul id={`${id}-rules`} className="grid gap-1 text-xs sm:grid-cols-2">
        {result.checks.map(check => (
          <li
            key={check.id}
            className={cn(
              "flex items-start gap-1.5",
              check.ok ? "text-success" : "text-muted-foreground",
            )}
          >
            {check.ok ? (
              <Check className="mt-px h-3.5 w-3.5 shrink-0" />
            ) : (
              <X className="mt-px h-3.5 w-3.5 shrink-0 opacity-60" />
            )}
            {check.label}
          </li>
        ))}
      </ul>

      <div
        id={`${id}-manager`}
        className="flex gap-3 rounded-xl border bg-surface p-3 text-xs leading-relaxed text-muted-foreground"
      >
        <KeyRound className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        {generated ? (
          <div className="grid gap-2">
            <p>
              <span className="font-medium text-foreground">Save this password in your password manager.</span>{" "}
              Your browser should offer to save it when you create the account. If it doesn&apos;t, copy it into
              iCloud Keychain, Google Password Manager, 1Password or Bitwarden now.
            </p>
            <button
              type="button"
              onClick={copy}
              className="inline-flex w-fit items-center gap-1.5 rounded-full border bg-background px-3 py-1 font-medium text-foreground hover:bg-accent"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied" : "Copy password"}
            </button>
          </div>
        ) : (
          <p>
            <span className="font-medium text-foreground">Use a password manager.</span> Let it create and
            remember a long, random password for you, so you never have to reuse or memorise one. Most
            browsers offer one when you tap this field, or use the suggestion above.
          </p>
        )}
      </div>
    </div>
  )
}
