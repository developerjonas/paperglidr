"use client"

import { useEffect, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { actionToast } from "@/hooks/use-toast"
import { deleteUserAccount, findCoursesToGrant, grantCourseAccess, setCreatorStorageLimit } from "../actions/users"

/** Search for a course and give it to this user (no purchase is recorded). */
export function GrantCourseForm({ userId }: { userId: string }) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<{ id: string; name: string; author: string }[] | null>(null)
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  useEffect(() => {
    if (query.trim().length < 2) return
    let stale = false
    const timer = setTimeout(async () => {
      const found = await findCoursesToGrant(query)
      if (!stale) setResults(found)
    }, 250)
    return () => {
      stale = true
      clearTimeout(timer)
    }
  }, [query])

  const shown = query.trim().length < 2 ? null : results

  return (
    <div className="flex flex-col gap-2">
      <Input
        placeholder="Search courses by name or creator…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label="Search courses to give"
      />
      {shown != null &&
        (shown.length === 0 ? (
          <p className="text-sm text-muted-foreground">No courses match.</p>
        ) : (
          <ul className="flex max-h-64 flex-col divide-y divide-border overflow-y-auto rounded-md border border-border">
            {shown.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                <span className="min-w-0">
                  <span className="block truncate font-medium">{c.name}</span>
                  <span className="block truncate text-xs text-muted-foreground">{c.author}</span>
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={pending}
                  onClick={() =>
                    startTransition(async () => {
                      const data = await grantCourseAccess(userId, c.id)
                      actionToast({ actionData: data })
                      if (!data.error) router.refresh()
                    })
                  }
                >
                  Give
                </Button>
              </li>
            ))}
          </ul>
        ))}
    </div>
  )
}

/** Deletes the account after the admin types DELETE. */
export function DeleteUserButton({ userId, email }: { userId: string; email: string }) {
  const [open, setOpen] = useState(false)
  const [confirmation, setConfirmation] = useState("")
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructiveOutline" size="sm">
          Delete account
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {email}?</AlertDialogTitle>
          <AlertDialogDescription>
            Their name, email, sign-in methods, course access and progress are removed, and every device is signed out. Purchases, invoices and
            refunds are kept; reviews and Q&A show as &ldquo;Deleted user&rdquo;. This can&apos;t be undone. Type DELETE to confirm.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <Input value={confirmation} onChange={(e) => setConfirmation(e.target.value)} placeholder="DELETE" aria-label="Type DELETE" />
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <Button
            variant="destructive"
            disabled={confirmation.trim() !== "DELETE" || pending}
            onClick={() =>
              startTransition(async () => {
                const data = await deleteUserAccount(userId, confirmation)
                actionToast({ actionData: data })
                if (!data.error) {
                  setOpen(false)
                  router.refresh()
                }
              })
            }
          >
            Delete for good
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

/** Shows a creator's storage use and lets an admin change their limit (GB). */
export function StorageLimitForm({ userId, usedBytes, limitBytes }: { userId: string; usedBytes: number; limitBytes: number }) {
  const GB = 1024 ** 3
  const [value, setValue] = useState(String(Number((limitBytes / GB).toFixed(1))))
  const [pending, startTransition] = useTransition()
  const router = useRouter()
  const percent = Math.min(100, Math.round((usedBytes / limitBytes) * 100))
  const fmt = (bytes: number) => (bytes >= GB ? `${Number((bytes / GB).toFixed(1))} GB` : `${Math.round(bytes / 1024 ** 2)} MB`)

  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>
          {fmt(usedBytes)} of {fmt(limitBytes)} used
        </span>
        <span>{percent}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted" aria-hidden>
        <div className={percent >= 90 ? "h-full bg-destructive" : "h-full bg-primary"} style={{ width: `${percent}%` }} />
      </div>
      <form
        className="flex items-center gap-2"
        onSubmit={(event) => {
          event.preventDefault()
          startTransition(async () => {
            const data = await setCreatorStorageLimit(userId, Number(value))
            actionToast({ actionData: data })
            if (!data.error) router.refresh()
          })
        }}
      >
        <Input
          type="number"
          min={1}
          max={1000}
          step={0.5}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          aria-label="Storage limit in GB"
          className="h-8 w-24"
        />
        <span className="text-sm text-muted-foreground">GB</span>
        <Button type="submit" size="sm" variant="outline" disabled={pending}>
          Save limit
        </Button>
      </form>
    </div>
  )
}
