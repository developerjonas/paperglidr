"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { requireAdmin } from "@/services/auth"
import { UserFacingError, actionError } from "@/lib/safeError"
import { approveProduct, rejectProduct } from "../lib/moderation"

export async function approveProductReview(productId: string) {
  const { userId: adminId } = await requireAdmin()
  try {
    if (!z.string().uuid().safeParse(productId).success) throw new UserFacingError("Product not found")
    const result = await approveProduct({ productId, adminId })
    if (result.outcome === "not_pending") throw new UserFacingError("This product isn't waiting for review")
    revalidatePath("/admin/products")
    return { error: false as const, message: "Approved: the product is live" }
  } catch (error) {
    return actionError(error, "approveProductReview")
  }
}

export async function rejectProductReview(productId: string, reason: string) {
  const { userId: adminId } = await requireAdmin()
  try {
    const parsed = z
      .object({ productId: z.string().uuid(), reason: z.string().trim().min(1).max(2000) })
      .safeParse({ productId, reason })
    if (!parsed.success) throw new UserFacingError("A reason is required")
    const result = await rejectProduct({ adminId, ...parsed.data })
    if (result.outcome === "not_pending") throw new UserFacingError("This product isn't waiting for review")
    revalidatePath("/admin/products")
    return { error: false as const, message: "Rejected; the creator has been emailed" }
  } catch (error) {
    return actionError(error, "rejectProductReview")
  }
}
