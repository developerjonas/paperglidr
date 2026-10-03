"use client"

import { useState, useTransition } from "react"
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
import { deleteUserAccount, grantCourseAccess } from "../actions/users"

/** Pick a course and give it to this user (no purchase is recorded). */
export function GrantCourseForm({ userId, courses }: { userId: string; courses: { id: string; name: string; author: string }[] }) {
  const [filter, setFilter] = useState("")
  const [courseId, setCourseId] = useState("")
  const [pending, startTransition] = useTransition()
  const shown = courses.filter((c) => `${c.name} ${c.author}`.toLowerCase().includes(filter.trim().toLowerCase()))

  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={(event) => {
        event.preventDefault()
        if (!courseId) return
        startTransition(async () => {
          const data = await grantCourseAccess(userId, courseId)
          actionToast({ actionData: data })
          if (!data.error) setCourseId("")
        })
      }}
    >
      <Input placeholder="Filter courses…" value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filter courses" />
      <div className="flex gap-2">
        <select
          value={courseId}
          onChange={(e) => setCourseId(e.target.value)}
          aria-label="Course to grant"
          className="h-9 min-w-0 flex-1 rounded-md border border-input bg-background px-2 text-sm"
        >
          <option value="">Choose a course ({shown.length})</option>
          {shown.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} — {c.author}
            </option>
          ))}
        </select>
        <Button type="submit" size="sm" disabled={!courseId || pending}>
          Grant
        </Button>
      </div>
    </form>
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
