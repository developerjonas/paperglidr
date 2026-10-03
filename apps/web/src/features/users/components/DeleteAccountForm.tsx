"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { deleteMyAccount } from "../actions/deleteAccount"

// Kept in sync with DELETE_ACCOUNT_CONFIRMATION (lib/deleteAccount.ts is server-only).
const CONFIRMATION = "DELETE"

export function DeleteAccountForm() {
  const [value, setValue] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault()
        setError(null)
        startTransition(async () => {
          // On success the action redirects to /account-deleted.
          const result = await deleteMyAccount(value)
          if (result?.error) setError(result.message)
        })
      }}
    >
      <div className="space-y-2">
        <label htmlFor="confirm-delete" className="text-sm font-medium">
          Type <span className="font-mono font-semibold">{CONFIRMATION}</span> to confirm
        </label>
        <Input
          id="confirm-delete"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          aria-invalid={error != null}
          aria-describedby={error ? "confirm-delete-error" : undefined}
          className="max-w-xs bg-background"
        />
        {error && (
          <p id="confirm-delete-error" role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
      </div>
      <Button type="submit" variant="destructive" disabled={pending || value.trim() !== CONFIRMATION}>
        {pending ? "Deleting…" : "Permanently delete my account"}
      </Button>
    </form>
  )
}
