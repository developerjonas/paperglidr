import { db } from "@/drizzle/db";
import { InstructorTable } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import {
  getInstructorHandleTag,
  getInstructorIdTag,
  getInstructorUserTag,
  revalidateInstructorCache,
} from "./cache/instructors";
import { cacheTag } from "next/dist/server/use-cache/cache-tag";
import { CourseTable, CourseProductTable, ProductTable } from "@/drizzle/schema"
import { and } from "drizzle-orm"

export async function getInstructorByUserId(userId: string) {
  "use cache";
  // Tagged so phone verification and profile edits show up immediately
  // (the payout gate reads phoneVerifiedAt from here).
  cacheTag(getInstructorUserTag(userId));
  return db.query.InstructorTable.findFirst({
    where: eq(InstructorTable.userId, userId),
  });
}

export async function getInstructorByHandle(handle: string) {
  "use cache";
  cacheTag(getInstructorHandleTag(handle));
  const instructor = await db.query.InstructorTable.findFirst({
    where: eq(InstructorTable.handle, handle),
  });
  if (instructor) cacheTag(getInstructorIdTag(instructor.id));
  return instructor;
}

export async function upsertInstructor(
  userId: string,
  data: { handle: string; name: string; bio: string; profileImageUrl: string }
) {
  const [instructor] = await db
    .insert(InstructorTable)
    .values({ userId, ...data })
    .onConflictDoUpdate({
      target: InstructorTable.userId,
      set: { ...data, updatedAt: new Date() },
    })
    .returning();
  if (!instructor) {
    throw new Error("Failed to save instructor profile");
  }
  // handle: the (possibly new) handle; the old one is covered by the id tag.
  revalidateInstructorCache({
    id: instructor.id,
    userId: instructor.userId,
    handle: instructor.handle,
  });
  return instructor;
}

export async function setInstructorVerified(id: string, isVerified: boolean) {
  const [instructor] = await db
    .update(InstructorTable)
    .set({ isVerified, updatedAt: new Date() })
    .where(eq(InstructorTable.id, id))
    .returning();
  if (!instructor) {
    throw new Error("Instructor not found");
  }
  revalidateInstructorCache({
    id: instructor.id,
    userId: instructor.userId,
    handle: instructor.handle,
  });
  return instructor;
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

// Public catalogue (GET /api/v1/instructors/[handle], no auth): the public
// profile only — never the phone number or the user id.
export async function getPublicInstructorByHandle(handle: string) {
  const [instructor] = await db
    .select({
      userId: InstructorTable.userId,
      handle: InstructorTable.handle,
      name: InstructorTable.name,
      bio: InstructorTable.bio,
      profileImageUrl: InstructorTable.profileImageUrl,
      isVerified: InstructorTable.isVerified,
    })
    .from(InstructorTable)
    .where(eq(InstructorTable.handle, handle))

  if (!instructor) return null

  const courses = await db
    .select({
      id: ProductTable.id,
      name: ProductTable.name,
      imageUrl: ProductTable.imageUrl,
    })
    .from(ProductTable)
    .where(
      and(
        // Products are authored by the user, not the instructor row.
        eq(ProductTable.authorId, instructor.userId),
        eq(ProductTable.status, "public")
      )
    )

  return {
    handle: instructor.handle,
    name: instructor.name,
    bio: instructor.bio,
    profileImageUrl: instructor.profileImageUrl,
    isVerified: instructor.isVerified,
    courses,
  }
}
