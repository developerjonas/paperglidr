import {
  getCourseTag,
  getGlobalTag,
  getIdTag,
  getUserTag,
} from "@/lib/dataCache";
import { revalidateTag } from "next/cache";

export function getCourseReviewGlobalTag() {
  return getGlobalTag("reviews");
}

export function getCourseReviewIdTag(id: string) {
  return getIdTag("reviews", id);
}

export function getCourseReviewCourseTag(courseId: string) {
  return getCourseTag("reviews", courseId);
}

export function getCourseReviewUserTag(userId: string) {
  return getUserTag("reviews", userId);
}

export function revalidateCourseReviewCache({
  id,
  courseId,
  userId,
}: {
  id: string;
  courseId: string;
  userId: string;
}) {
  revalidateTag(getCourseReviewGlobalTag());
  revalidateTag(getCourseReviewIdTag(id));
  revalidateTag(getCourseReviewCourseTag(courseId));
  revalidateTag(getCourseReviewUserTag(userId));
}
