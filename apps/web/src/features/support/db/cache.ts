// Destination: apps/web/src/features/support/db/cache.ts
//
// NOTE: also add "supportTickets" to the CACHE_TAG union in
// lib/dataCache.ts, e.g.:
//   type CACHE_TAG = | "products" | ... | "wishlist" | "supportTickets";

import { getGlobalTag, getIdTag, getUserTag } from "@/lib/dataCache";
import { revalidateTag } from "next/cache";

export function getSupportTicketGlobalTag() {
  return getGlobalTag("supportTickets");
}

export function getSupportTicketIdTag(id: string) {
  return getIdTag("supportTickets", id);
}

export function getSupportTicketUserTag(userId: string) {
  return getUserTag("supportTickets", userId);
}

export function revalidateSupportTicketCache({
  id,
  userId,
}: {
  id: string;
  userId: string;
}) {
  revalidateTag(getSupportTicketGlobalTag());
  revalidateTag(getSupportTicketIdTag(id));
  revalidateTag(getSupportTicketUserTag(userId));
}
