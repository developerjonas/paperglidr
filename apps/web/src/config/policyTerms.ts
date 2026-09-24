import { MINIMUM_PAYOUT_PAISA } from "@/features/payouts/db/payouts"
import { MIN_DESCRIPTION_LENGTH } from "@/features/products/lib/canPublishProduct"
import {
  REFUND_COMPLETION_THRESHOLD_PERCENT,
  REFUND_WINDOW_MS,
} from "@/features/refunds/lib/refundTerms"
import { PLATFORM_FEE_RATE_BPS } from "@/lib/comissionRate"
import { REF_COOKIE_MAX_AGE_SECONDS } from "@/lib/referral"

/**
 * Display values for the policy pages, DERIVED from the constants the code
 * enforces — never restated. Change a rate or rule in its source module and
 * every policy page follows.
 */
const npr = (rupees: number) => `NPR ${rupees.toLocaleString("en-IN")}`

export const POLICY_TERMS = {
  refundWindowDays: REFUND_WINDOW_MS / (24 * 60 * 60 * 1000),
  refundWindowHours: REFUND_WINDOW_MS / (60 * 60 * 1000),
  refundCompletionThresholdPercent: REFUND_COMPLETION_THRESHOLD_PERCENT,
  minimumPayout: npr(MINIMUM_PAYOUT_PAISA / 100),
  platformFeePercent: {
    referralLink: PLATFORM_FEE_RATE_BPS.instructor_link / 100,
    platform: PLATFORM_FEE_RATE_BPS.platform / 100,
  },
  creatorSharePercent: {
    referralLink: 100 - PLATFORM_FEE_RATE_BPS.instructor_link / 100,
    platform: 100 - PLATFORM_FEE_RATE_BPS.platform / 100,
  },
  referralWindowDays: REF_COOKIE_MAX_AGE_SECONDS / (24 * 60 * 60),
  minDescriptionLength: MIN_DESCRIPTION_LENGTH,
} as const
