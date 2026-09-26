"use server"
import {
  PAID_LESSON_NO_EMBED_MESSAGE,
  isFreeTierPlacement,
  lessonHasEmbed,
  lessonHasHostedVideo,
  needsEmbedMessage,
} from "../lib/freeTier"
import { z } from "zod"
import { lessonSchema } from "../schemas/lessons"
import { getCurrentUser } from "@/services/auth"
import {
  canCreateLessons,
  canDeleteLessons,
  canUpdateLessons,
} from "../permissions/lessons"
import {
  getNextCourseLessonOrder,
  insertLesson,
  updateLesson as updateLessonDb,
  deleteLesson as deleteLessonDb,
  updateLessonOrders as updateLessonOrdersDb,
} from "../db/lessons"
export async function createLesson(unsafeData: z.infer<typeof lessonSchema>) {
  const { success, data } = lessonSchema.safeParse(unsafeData)
  if (
    !success ||
    !(await canCreateLessons(await getCurrentUser(), data.sectionId))
  ) {
    return { error: true, message: "There was an error creating your lesson" }
  }
  const order = await getNextCourseLessonOrder(data.sectionId)
  const newLesson = await insertLesson({ ...data, order })
  return {
    error: false,
    message: "Successfully created your lesson",
    id: newLesson.id,
  }
}
export async function updateLesson(
  id: string,
  unsafeData: z.infer<typeof lessonSchema>
) {
  const { success, data } = lessonSchema.safeParse(unsafeData)
  const user = await getCurrentUser()
  // The lesson must be the caller's AND so must the section it's being
  // saved into — sectionId comes from the form, and without the second
  // check a lesson could be moved into another creator's course.
  if (
    !success ||
    !(await canUpdateLessons(user, id)) ||
    !(await canCreateLessons(user, data.sectionId))
  ) {
    return { error: true, message: "There was an error updating your lesson" }
  }
  // Free-tier lessons (previews, free courses) use an embed; paid lessons
  // hosted video. The status or the section (course) may be changing.
  const freeTier = await isFreeTierPlacement(data)
  if (freeTier && (await lessonHasHostedVideo(id))) {
    return {
      error: true,
      message: `${needsEmbedMessage(data.status)} Remove the uploaded video before making this change.`,
    }
  }
  if (!freeTier && (await lessonHasEmbed(id))) {
    return {
      error: true,
      message: `${PAID_LESSON_NO_EMBED_MESSAGE} Replace the video before making this change.`,
    }
  }
  await updateLessonDb(id, data)
  return { error: false, message: "Successfully updated your lesson" }
}
export async function deleteLesson(id: string) {
  if (!(await canDeleteLessons(await getCurrentUser(), id))) {
    return { error: true, message: "Error deleting your lesson" }
  }
  await deleteLessonDb(id)
  return { error: false, message: "Successfully deleted your lesson" }
}
export async function updateLessonOrders(lessonIds: string[]) {
  const user = await getCurrentUser()
  // Every id must be authorized, not just the first.
  const allowed =
    lessonIds.length > 0 &&
    (await Promise.all(lessonIds.map(id => canUpdateLessons(user, id)))).every(
      Boolean
    )
  if (!allowed) {
    return { error: true, message: "Error reordering your lessons" }
  }
  await updateLessonOrdersDb(lessonIds)
  return { error: false, message: "Successfully reordered your lessons" }
}
