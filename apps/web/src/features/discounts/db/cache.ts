import { revalidateTag } from "next/cache"
import { getGlobalTag, getIdTag, getUserTag } from "@/lib/dataCache"
// ADJUST: names/signatures inferred from getProductGlobalTag/getProductIdTag's
// usage in features/products/db/cache.ts — verify against your real dataCache.ts.

export function getDiscountCodeGlobalTag() {
  return getGlobalTag("discountCodes")
}

export function getDiscountCodeIdTag(id: string) {
  return getIdTag("discountCodes", id)
}

// Scoped by creator, not by product. A "storewide" code can't be tied to
// one product's cache tag, and a "product" code's tag would need
// invalidating on both its own product page AND, on scope change, its old
// product's page — awkward to get right. Tagging by creator instead means
// editing ANY of a creator's codes invalidates every one of their product
// pages' discount sections, which is a coarser cache than ideal but never
// wrong, and discount-code edits are rare relative to product page views.
export function getDiscountCodeCreatorTag(creatorId: string) {
  return getUserTag("discountCodes", creatorId)
}

export function revalidateDiscountCodeCache(id: string, creatorId: string) {
  revalidateTag(getDiscountCodeGlobalTag())
  revalidateTag(getDiscountCodeIdTag(id))
  revalidateTag(getDiscountCodeCreatorTag(creatorId))
}
