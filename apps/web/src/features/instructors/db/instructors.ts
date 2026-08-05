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
    .values({ userId, ...data, isVerified: false })
    .onConflictDoUpdate({
      target: InstructorTable.userId,
      set: { ...data, isVerified: false, updatedAt: new Date() },
    })
    .returning();

  if (!instructor) {
    throw new Error("Failed to save instructor profile");
  }

  revalidateInstructorCache({ id: instructor.id, userId: instructor.userId });
  return instructor;
}
