import { getGlobalTag, getIdTag, getUserTag } from "@/lib/dataCache";
import { revalidateTag } from "next/cache";

export function getInstructorGlobalTag() {
  return getGlobalTag("instructors");
}

export function getInstructorIdTag(id: string) {
  return getIdTag("instructors", id);
}

export function getInstructorUserTag(userId: string) {
  return getUserTag("instructors", userId);
}

export function revalidateInstructorCache({
  id,
  userId,
}: {
  id: string;
  userId: string;
}) {
  revalidateTag(getInstructorGlobalTag());
  revalidateTag(getInstructorIdTag(id));
  revalidateTag(getInstructorUserTag(userId));
}
