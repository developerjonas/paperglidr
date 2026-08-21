import { db } from "@/drizzle/db";
import { InstructorTable } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { revalidateInstructorCache } from "./cache/instructors";
import { CourseTable, CourseProductTable, ProductTable } from "@/drizzle/schema"
import { and } from "drizzle-orm"

export async function getInstructorByUserId(userId: string) {
  "use cache";
  return db.query.InstructorTable.findFirst({
    where: eq(InstructorTable.userId, userId),
  });
}

export async function getInstructorByHandle(handle: string) {
  "use cache";
  return db.query.InstructorTable.findFirst({
    where: eq(InstructorTable.handle, handle),
  });
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
  revalidateInstructorCache({ id: instructor.id, userId: instructor.userId });
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
  revalidateInstructorCache({ id: instructor.id, userId: instructor.userId });
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

export async function getPublicInstructorByHandle(handle: string) {
  const [instructor] = await db
    .select()
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
        eq(ProductTable.authorId, instructor.id),
        eq(ProductTable.status, "public")
      )
    )

  return { ...instructor, courses }
}
