"use server"

import { z } from "zod"
import { courseSchema } from "../schemas/courses"
import { redirect } from "next/navigation"
import { getCurrentUser } from "@/services/clerk"
import {
  canCreateCourses,
  canDeleteCourses,
  canUpdateCourses,
} from "../permissions/courses"
import {
  insertCourse,
  deleteCourse as deleteCourseDB,
  updateCourse as updateCourseDb,
} from "../db/courses"

export async function createCourse(unsafeData: z.infer<typeof courseSchema>) {
  const { success, data } = courseSchema.safeParse(unsafeData)
  const user = await getCurrentUser()

  if (!success || !user || !canCreateCourses({ userId: user.userId })) {
    return { error: true, message: "There was an error creating your course" }
  }

  // Pass authorId alongside course data
  const course = await insertCourse({
    ...data,
    authorId: user.userId ?? "",
  })

  redirect(`/teach/courses/${course.id}/edit`)
}

export async function updateCourse(
  id: string,
  unsafeData: z.infer<typeof courseSchema>
) {
  const { success, data } = courseSchema.safeParse(unsafeData)
  const user = await getCurrentUser()

  const isAllowed = await canUpdateCourses(
    { userId: user?.userId, role: user?.role },
    id
  )

  if (!success || !user || !isAllowed) {
    return { error: true, message: "There was an error updating your course" }
  }

  await updateCourseDb(id, data)

  return { error: false, message: "Successfully updated your course" }
}

export async function deleteCourse(id: string) {
  const user = await getCurrentUser()

  const isAllowed = await canDeleteCourses(
    { userId: user?.userId, role: user?.role },
    id
  )

  if (!user || !isAllowed) {
    return { error: true, message: "Error deleting your course" }
  }

  await deleteCourseDB(id)

  return { error: false, message: "Successfully deleted your course" }
}
