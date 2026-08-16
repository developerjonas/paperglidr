import type { AppUser } from "@/services/auth";

export function canCreateInstructorProfile(user: AppUser | null) {
  return !!user;
}

export function canEditInstructorProfile(user: AppUser | null, instructor: { userId: string }) {
  return !!user && user.userId === instructor.userId;
}

export function canVerifyInstructor(user: AppUser | null) {
  return !!user && user.role === "admin";
}
