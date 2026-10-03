"use server";

import { getCurrentUser } from "@/services/auth";
import { instructorSchema, type InstructorFormValues } from "../schemas/instructors";
import { canCreateInstructorProfile } from "../permissions/instructors";
import { upsertInstructor, getInstructorByHandle, getInstructorByUserId } from "../db/instructors";
import { CREATOR_TERMS_VERSION } from "@/config/company";
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

  // The Creator Terms (including owning the rights to what you upload)
  // must be accepted, once per version.
  const current = await getInstructorByUserId(user.userId);
  const mustAccept = current?.creatorTermsVersion !== CREATOR_TERMS_VERSION;
  if (mustAccept && data.acceptCreatorTerms !== true) {
    return { error: true, message: "Please accept the Creator Terms to continue." };
  }

  await upsertInstructor(
    user.userId,
    { handle: data.handle, name: data.name, bio: data.bio, profileImageUrl: data.profileImageUrl },
    mustAccept ? CREATOR_TERMS_VERSION : undefined,
  );
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
