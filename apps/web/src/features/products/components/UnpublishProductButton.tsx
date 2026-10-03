"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
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
import { unpublishProductAsAdmin } from "../actions/moderation"

/** Takes a live product off sale, with a reason the creator is emailed. */
export function UnpublishProductButton({ productId, name }: { productId: string; name: string }) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState("")
  const [pending, startTransition] = useTransition()

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-destructive">
          Unpublish
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Take &ldquo;{name}&rdquo; off sale?</AlertDialogTitle>
          <AlertDialogDescription>
            It disappears from the site and the app at once. Students who bought it keep their access. The creator is emailed the reason
            and can fix it and resubmit.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason (emailed to the creator)" rows={4} />
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <Button
            variant="destructive"
            disabled={!reason.trim() || pending}
            onClick={() =>
              startTransition(async () => {
                const data = await unpublishProductAsAdmin(productId, reason)
                actionToast({ actionData: data })
                if (!data.error) {
                  setOpen(false)
                  setReason("")
                }
              })
            }
          >
            Unpublish
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
