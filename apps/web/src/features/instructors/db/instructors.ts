import { db } from "@/drizzle/db";
import { InstructorTable } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { revalidateInstructorCache } from "./cache/instructors";

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
    .values({ userId, ...data }) // isVerified defaults false, untouched
    .onConflictDoUpdate({
      target: InstructorTable.userId,
      set: { ...data, updatedAt: new Date() }, // does NOT touch isVerified
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
