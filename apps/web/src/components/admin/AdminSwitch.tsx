"use client"

import { useState, useTransition } from "react"
import { actionToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

/** An on/off switch for an admin setting, saved through a server action. */
export function AdminSwitch({
  label,
  checked,
  onChangeAction,
}: {
  /** Read by screen readers, e.g. "Founding creator for Sita Sharma". */
  label: string
  checked: boolean
  onChangeAction: (value: boolean) => Promise<{ error: boolean; message: string }>
}) {
  const [value, setValue] = useState(checked)
  const [pending, startTransition] = useTransition()

  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      aria-label={label}
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const next = !value
          setValue(next)
          const result = await onChangeAction(next)
          actionToast({ actionData: result })
          if (result.error) setValue(!next)
        })
      }
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border border-transparent transition-colors disabled:opacity-60",
        value ? "bg-primary" : "bg-muted-foreground/30",
      )}
    >
      <span
        className={cn(
          "inline-block h-5 w-5 rounded-full bg-background shadow transition-transform",
          value ? "translate-x-5" : "translate-x-0.5",
        )}
      />
    </button>
  )
}
