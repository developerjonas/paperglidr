"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { replyToQuestionSchema } from "@/features/lessonQuestions/schemas/lessonQuestions"
import { replyToLessonQuestion } from "@/features/lessonQuestions/actions/lessonQuestions"
import { z } from "zod"

type FormValues = z.infer<typeof replyToQuestionSchema>

export function ReplyForm({ questionId }: { questionId: string }) {
  const { toast } = useToast()
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [open, setOpen] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(replyToQuestionSchema),
    defaultValues: { body: "" },
  })

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true)
    const result = await replyToLessonQuestion(questionId, values)
    setIsSubmitting(false)

    if (result.error) {
      toast({ variant: "destructive", description: result.message })
      return
    }

    toast({ description: result.message })
    form.reset()
    setOpen(false)
    router.refresh()
  }

  if (!open) {
    return (
      <Button variant="ghost" size="sm" onClick={() => setOpen(true)}>
        Reply
      </Button>
    )
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-2 pl-4"
      >
        <FormField
          control={form.control}
          name="body"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Textarea placeholder="Write a reply..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex gap-2 self-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
          <Button type="submit" size="sm" disabled={isSubmitting}>
            {isSubmitting ? "Posting..." : "Post reply"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
