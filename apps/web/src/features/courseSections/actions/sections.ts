"use server"

import { z } from "zod"
import { getCurrentUser } from "@/services/auth"
import { sectionSchema } from "../schemas/sections"
import {
  canCreateCourseSections,
  canDeleteCourseSections,
  canUpdateCourseSections,
} from "../permissions/sections"
import {
  getNextCourseSectionOrder,
  insertSection,
  updateSection as updateSectionDb,
  deleteSection as deleteSectionDb,
  updateSectionOrders as updateSectionOrdersDb,
} from "../db/sections"

export async function createSection(
  courseId: string,
  unsafeData: z.infer<typeof sectionSchema>
) {
  const { success, data } = sectionSchema.safeParse(unsafeData)

  if (
    !success ||
    !(await canCreateCourseSections(await getCurrentUser(), courseId))
  ) {
    return { error: true, message: "There was an error creating your section" }
  }

  const order = await getNextCourseSectionOrder(courseId)

  await insertSection({ ...data, courseId, order })

  return { error: false, message: "Successfully created your section" }
}

export async function updateSection(
  id: string,
  unsafeData: z.infer<typeof sectionSchema>
) {
  const { success, data } = sectionSchema.safeParse(unsafeData)

  if (!success || !(await canUpdateCourseSections(await getCurrentUser(), id))) {
    return { error: true, message: "There was an error updating your section" }
  }

  await updateSectionDb(id, data)

  return { error: false, message: "Successfully updated your section" }
}

export async function deleteSection(id: string) {
  if (!(await canDeleteCourseSections(await getCurrentUser(), id))) {
    return { error: true, message: "Error deleting your section" }
  }

  await deleteSectionDb(id)

  return { error: false, message: "Successfully deleted your section" }
}

export async function updateSectionOrders(sectionIds: string[]) {
  const user = await getCurrentUser()
  // Every id must be authorized, not just the first — otherwise one owned
  // section id at the front lets a caller reorder anyone's sections.
  const allowed =
    sectionIds.length > 0 &&
    (
      await Promise.all(sectionIds.map(id => canUpdateCourseSections(user, id)))
    ).every(Boolean)
  if (!allowed) {
    return { error: true, message: "Error reordering your sections" }
  }

  await updateSectionOrdersDb(sectionIds)

  return { error: false, message: "Successfully reordered your sections" }
}
