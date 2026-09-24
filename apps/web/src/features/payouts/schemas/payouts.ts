import { z } from "zod"
import type { PayoutDetails } from "@/drizzle/schema"

const text = (label: string, max = 100) =>
  z.string().trim().min(1, `${label} is required`).max(max)

// Nepali wallet IDs are the registered mobile number: 10 digits starting 9.
const walletId = z
  .string()
  .trim()
  .regex(/^9\d{9}$/, "Enter the 10-digit mobile number registered with the wallet")

export const payoutDetailsSchema = z.discriminatedUnion("method", [
  z.object({
    method: z.literal("bank"),
    bankName: text("Bank name"),
    accountName: text("Account name"),
    accountNumber: z
      .string()
      .trim()
      .regex(/^[0-9A-Za-z-]{6,30}$/, "Enter a valid account number"),
    branch: text("Branch"),
  }),
  z.object({ method: z.literal("esewa"), walletId, accountName: text("Account name") }),
  z.object({ method: z.literal("khalti"), walletId, accountName: text("Account name") }),
])

export const payoutRequestSchema = z.object({
  amountInRupees: z.coerce.number().positive().max(10_000_000),
  details: payoutDetailsSchema,
})

export type PayoutRequestInput = z.input<typeof payoutRequestSchema>

/** The human-readable snapshot shown to admins and stored with the payout. */
export function formatPayoutDetails(details: PayoutDetails) {
  return details.method === "bank"
    ? [
        `Bank transfer`,
        `Bank: ${details.bankName}`,
        `Branch: ${details.branch}`,
        `Account name: ${details.accountName}`,
        `Account number: ${details.accountNumber}`,
      ].join("\n")
    : [
        details.method === "esewa" ? "eSewa" : "Khalti",
        `Wallet ID: ${details.walletId}`,
        `Account name: ${details.accountName}`,
      ].join("\n")
}
