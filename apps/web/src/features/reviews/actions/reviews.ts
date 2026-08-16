"use server";

import { z } from "zod";
import { getCurrentUser } from "@/services/auth";
import { reviewSchema } from "../schemas/reviews";
import {
  canCreateCourseReview,
  canUpdateCourseReview,
  canDeleteCourseReview,
  canHideCourseReview,
  canReplyToCourseReview,
} from "../permissions/reviews";
import {
  insertReview,
  deleteReview as deleteReviewDb,
  setReviewHidden,
  updateReviewContent,
  setInstructorReply,
} from "../db/reviews";

export async function createReview(
  courseId: string,
  unsafeData: z.infer<typeof reviewSchema>,
) {
  const { success, data } = reviewSchema.safeParse(unsafeData);
  const currentUser = await getCurrentUser();

  if (!success || !(await canCreateCourseReview(currentUser, courseId))) {
    return {
      error: true,
      message:
        "You need to complete at least 50% of this course before leaving a review.",
    };
  }

  await insertReview({ ...data, courseId, userId: currentUser.userId! });
  return { error: false, message: "Successfully submitted your review" };
}

export async function deleteReview(id: string) {
  const currentUser = await getCurrentUser();

  if (!(await canDeleteCourseReview(currentUser, id))) {
    return { error: true, message: "Error deleting your review" };
  }

  await deleteReviewDb(id);
  return { error: false, message: "Successfully deleted your review" };
}

export async function hideReview(id: string, isHidden: boolean) {
  const currentUser = await getCurrentUser();

  if (!canHideCourseReview(currentUser)) {
    return { error: true, message: "Not authorized" };
  }

  await setReviewHidden(id, isHidden);
  return {
    error: false,
    message: isHidden ? "Review hidden" : "Review unhidden",
  };
}

export async function updateReview(
  id: string,
  unsafeData: z.infer<typeof reviewSchema>,
) {
  const { success, data } = reviewSchema.safeParse(unsafeData);
  const currentUser = await getCurrentUser();

  if (!success || !(await canUpdateCourseReview(currentUser, id))) {
    return { error: true, message: "There was an error updating your review" };
  }

  await updateReviewContent(id, data); // clears instructor reply, per Udemy behavior
  return { error: false, message: "Successfully updated your review" };
}

export async function replyToReview(id: string, reply: string) {
  const currentUser = await getCurrentUser();
  if (!reply.trim() || !(await canReplyToCourseReview(currentUser, id))) {
    return { error: true, message: "Not authorized to reply" };
  }
  await setInstructorReply(id, reply);
  return { error: false, message: "Reply posted" };
}

export async function deleteReply(id: string) {
  const currentUser = await getCurrentUser();
  if (!(await canReplyToCourseReview(currentUser, id))) {
    return { error: true, message: "Not authorized" };
  }
  await setInstructorReply(id, null);
  return { error: false, message: "Reply removed" };
}
