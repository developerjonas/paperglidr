"use server";

import { getCurrentUser } from "@/services/clerk";
import { instructorSchema, type InstructorFormValues } from "../schemas/instructors";
import { canCreateInstructorProfile } from "../permissions/instructors";
import { upsertInstructor, getInstructorByHandle } from "../db/instructors";
import { CourseProductTable, CourseTable, ProductTable } from "@/drizzle/schema";
import { db } from "@/drizzle/db";
import { and, eq } from "drizzle-orm";

export async function saveInstructorProfile(unsafeData: InstructorFormValues) {
  const user = await getCurrentUser();

  if (!user?.userId || !canCreateInstructorProfile(user)) {
    return { error: true, message: "You must be signed in." };
  }

  const { success, data, error } = instructorSchema.safeParse(unsafeData);
  if (!success) {
    return { error: true, message: error.issues[0]?.message ?? "Invalid data" };
  }

  const existing = await getInstructorByHandle(data.handle);
  if (existing && existing.userId !== user.userId) {
    return { error: true, message: "That handle is already taken." };
  }

  await upsertInstructor(user.userId, data);
  return {
    error: false,
    message: "Profile submitted — you'll be able to publish once verified.",
    handle: data.handle,
  };
}

export async function getInstructorPublishedCourses(instructorUserId: string) {
  const rows = await db
    .selectDistinct({
      id: CourseTable.id,
      name: CourseTable.name,
      description: CourseTable.description,
    })
    .from(CourseTable)
    .innerJoin(CourseProductTable, eq(CourseProductTable.courseId, CourseTable.id))
    .innerJoin(ProductTable, eq(ProductTable.id, CourseProductTable.productId))
    .where(and(eq(CourseTable.authorId, instructorUserId), eq(ProductTable.status, "public")))

  return rows
}
