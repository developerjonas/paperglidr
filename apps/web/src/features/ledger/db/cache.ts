import { getGlobalTag, getIdTag, getUserTag } from "@/lib/dataCache";
import { revalidateTag } from "next/cache";

export function getLedgerEntryGlobalTag() {
  return getGlobalTag("ledgerEntries");
}
export function getLedgerEntryIdTag(id: string) {
  return getIdTag("ledgerEntries", id);
}
export function getLedgerEntryInstructorTag(instructorId: string) {
  return getUserTag("ledgerEntries", instructorId);
}

export function revalidateLedgerEntryCache({
  id,
  instructorId,
}: {
  id: string;
  instructorId: string;
}) {
  revalidateTag(getLedgerEntryGlobalTag());
  revalidateTag(getLedgerEntryIdTag(id));
  revalidateTag(getLedgerEntryInstructorTag(instructorId));
}
