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

// Public profile lookups by handle (/instructors/[handle]). A cached miss
// for a handle only carries this tag, so a newly claimed handle must be
// revalidated by name; a cached hit also carries the instructor's id tag,
// which covers the old handle when it changes.
export function getInstructorHandleTag(handle: string) {
  return getIdTag("instructors", `handle:${handle.toLowerCase()}`);
}

export function revalidateInstructorCache({
  id,
  userId,
  handle,
}: {
  id: string;
  userId: string;
  handle?: string;
}) {
  revalidateTag(getInstructorGlobalTag());
  revalidateTag(getInstructorIdTag(id));
  revalidateTag(getInstructorUserTag(userId));
  if (handle) revalidateTag(getInstructorHandleTag(handle));
}
