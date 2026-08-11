// features/ledger/lib/commissionRates.ts
import { RevenueSourceType } from "@/drizzle/schema/ledgerEntry"

export const PLATFORM_FEE_RATE_BPS: Record<RevenueSourceType, number> = {
  instructor_link: 3000, // instructor's own referral link → platform keeps 30%
  platform: 5000,        // platform-driven discovery → platform keeps 50%
}

export function resolveRevenueSource(
  referredByInstructorId: string | null,
  courseInstructorId: string
): RevenueSourceType {
  return referredByInstructorId === courseInstructorId ? "instructor_link" : "platform"
}
