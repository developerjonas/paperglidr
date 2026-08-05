import type { AppUser } from "@/services/clerk"; // adjust path/export name to match where AppUser actually lives

export function canCreateInstructorProfile(user: AppUser | null) {
  return !!user;
}

export function canEditInstructorProfile(user: AppUser | null, instructor: { userId: string }) {
  return !!user && user.userId === instructor.userId;
}
