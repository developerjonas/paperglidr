"use server";

import { z } from "zod";
import { getCurrentUser } from "@/services/clerk";
import { reviewSchema } from "../schemas/reviews";
import {
  canCreateCourseReview,
  canUpdateCourseReview,
  canDeleteCourseReview,
  canHideCourseReview,
} from "../permissions/reviews";
import {
  insertReview,
  updateReview as updateReviewDb,
  deleteReview as deleteReviewDb,
  setReviewHidden,
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

export async function updateReview(
  id: string,
  unsafeData: z.infer<typeof reviewSchema>,
) {
  const { success, data } = reviewSchema.safeParse(unsafeData);
  const currentUser = await getCurrentUser();

  if (!success || !(await canUpdateCourseReview(currentUser, id))) {
    return { error: true, message: "There was an error updating your review" };
  }

  await updateReviewDb(id, data);
  return { error: false, message: "Successfully updated your review" };
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
