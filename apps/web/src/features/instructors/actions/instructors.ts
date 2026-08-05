"use server";

import { getCurrentUser } from "@/services/clerk";
import { instructorSchema, type InstructorFormValues } from "../schemas/instructors";
import { canCreateInstructorProfile, canVerifyInstructor } from "../permissions/instructors";
import { upsertInstructor, getInstructorByHandle, setInstructorVerified } from "../db/instructors";

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

export async function verifyInstructor(instructorId: string) {
  const user = await getCurrentUser();

  if (!canVerifyInstructor(user)) {
    return { error: true, message: "Not authorized." };
  }

  await setInstructorVerified(instructorId, true);
  return { error: false, message: "Instructor verified" };
}
