"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { RequiredLabelIcon } from "@/components/RequiredLabelIcon"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { actionToast } from "@/hooks/use-toast"
import { LessonStatus, lessonStatuses } from "@/drizzle/schema"
import {
  Select,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectContent,
} from "@/components/ui/select"
import { lessonSchema } from "../schemas/lessons"
import { Textarea } from "@/components/ui/textarea"
import { createLesson, updateLesson } from "../actions/lessons"
import { LessonAssetManager } from "./LessonAssetManager"

export function LessonForm({
  sections,
  defaultSectionId,
  onSuccessAction,
  lesson,
}: {
  sections: {
    id: string
    name: string
  }[]
  onSuccessAction?: () => void
  defaultSectionId?: string
  lesson?: {
    id: string
    name: string
    status: LessonStatus
    description: string | null
    sectionId: string
  }
}) {
  // Editing an existing lesson already has an id, so both steps show at
  // once. A brand-new lesson has no id until the first save — that's the
  // only thing gating step 2.
  const [savedLessonId, setSavedLessonId] = useState<string | null>(
    lesson?.id ?? null
  )
  // The status as saved on the server — what decides whether a YouTube
  // video is allowed (free previews only).
  const [savedStatus, setSavedStatus] = useState<LessonStatus | null>(
    lesson?.status ?? null
  )

  const form = useForm<z.infer<typeof lessonSchema>>({
    resolver: zodResolver(lessonSchema),
    defaultValues: {
      name: lesson?.name ?? "",
      status: lesson?.status ?? "public",
      description: lesson?.description ?? "",
      sectionId: lesson?.sectionId ?? defaultSectionId ?? sections[0]?.id ?? "",
    },
  })

  async function onSubmit(values: z.infer<typeof lessonSchema>) {
    // Once the lesson exists (passed in, or created by the first save),
    // every save updates it. Deciding by the `lesson` prop meant a second
    // "Save details" after creating called createLesson again: a duplicate.
    const isNew = savedLessonId == null
    const action = isNew
      ? createLesson
      : updateLesson.bind(null, savedLessonId)
    const data = await action(values)
    actionToast({ actionData: data })
    if (data.error) return
    setSavedStatus(values.status)

    if (isNew && "id" in data && typeof data.id === "string") {
      // Now in edit mode for the new lesson. Stay on the form so the asset
      // manager can appear — calling onSuccessAction?.() here would close
      // the dialog before the instructor can upload content.
      setSavedLessonId(data.id)
      return
    }

    onSuccessAction?.()
  }

  return (
    <div className="flex flex-col gap-6">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex gap-6 flex-col @container"
        >
          <div className="grid grid-cols-1 @lg:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    <RequiredLabelIcon />
                    Name
                  </FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="sectionId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Section</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {sections.map(section => (
                        <SelectItem key={section.id} value={section.id}>
                          {section.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {lessonStatuses.map(status => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    className="min-h-20 resize-none"
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="self-end">
            <Button disabled={form.formState.isSubmitting} type="submit">
              {savedLessonId ? "Save details" : "Continue"}
            </Button>
          </div>
        </form>
      </Form>

      {savedLessonId ? (
        <LessonAssetManager lessonId={savedLessonId} lessonStatus={savedStatus} />
      ) : (
        <p className="text-sm text-muted-foreground">
          Save the lesson details first, then you&apos;ll be able to upload a PDF
          or video for it.
        </p>
      )}

      {savedLessonId && lesson == null && (
        <div className="self-end">
          <Button type="button" onClick={() => onSuccessAction?.()}>
            Done
          </Button>
        </div>
      )}
    </div>
  )
}
