import "server-only"
import { POLICY_TERMS } from "@/config/policyTerms"
import { SITE_URL } from "@/lib/site"

/**
 * Ready-made answers for the admin support inbox (inserted into the reply
 * box, then edited before sending). `{name}` becomes the customer's first
 * name. Numbers come from POLICY_TERMS, so a reply never contradicts the
 * policies. Add or change replies here.
 */
export type SavedReply = { id: string; title: string; body: string }

const {
  refundWindowDays,
  refundCompletionThresholdPercent,
  payoutHoldDays,
  minimumPayout,
  payoutRequiresVerifiedPhone,
} = POLICY_TERMS

export const SAVED_REPLIES: SavedReply[] = [
  {
    id: "paid-no-access",
    title: "I paid but have no access",
    body: `Hi {name},

Sorry about this. Sometimes the payment app confirms a moment before we hear back from it. We check every pending payment with eSewa, Khalti and Fonepay automatically within a few minutes, and I've just re-checked yours by hand as well.

Could you reply with:
1. the course you bought,
2. the transaction ID or a screenshot from your payment app, and
3. the time you paid?

If the money left your account, you'll get access, or a full refund if the payment can't be matched. You won't be charged twice.

Chiyali Support`,
  },
  {
    id: "video-wont-play",
    title: "Video won't play",
    body: `Hi {name},

Sorry the lesson isn't playing. These usually fix it:
1. Refresh the page, or close and reopen the app.
2. Try another connection (Wi-Fi instead of mobile data, or the other way round).
3. Update your browser or the Chiyali app, or try Chrome.
4. If the lesson is a YouTube or Vimeo video, check that YouTube or Vimeo isn't blocked on your network.

If it still doesn't play, please reply with the course and lesson name, your phone or computer and browser, and a screenshot of what you see. We'll look into it straight away.

Chiyali Support`,
  },
  {
    id: "refund-how",
    title: "How to get a refund",
    body: `Hi {name},

You can ask for a refund within ${refundWindowDays} days of buying, as long as you've completed less than ${refundCompletionThresholdPercent}% of the course's lessons. Open My Purchases (${SITE_URL}/purchases), choose the purchase and use the refund button there, or reply here with the course name.

Refunds go back through the same payment method you used (the same eSewa or Khalti account, or your bank through Fonepay). Once a refund is approved, access to the course ends.

Chiyali Support`,
  },
  {
    id: "refund-not-eligible",
    title: "Refund not possible (outside the policy)",
    body: `Hi {name},

Thanks for getting in touch. Our refund policy covers requests made within ${refundWindowDays} days of purchase where less than ${refundCompletionThresholdPercent}% of the course has been completed, and this purchase is outside that, so I'm not able to refund it.

If something about the course itself is wrong (missing lessons, misleading description), tell me what happened and I'll take it up with the instructor.

Chiyali Support`,
  },
  {
    id: "certificate",
    title: "Where is my certificate?",
    body: `Hi {name},

Your certificate is issued automatically as soon as every lesson in the course is marked complete. You'll find it in My Certificates (${SITE_URL}/certificates), and anyone can check it by scanning its QR code.

If you've finished every lesson and it isn't there, reply with the course name and we'll sort it out.

Chiyali Support`,
  },
  {
    id: "sign-in",
    title: "Can't sign in / forgot password",
    body: `Hi {name},

You can set a new password here: ${SITE_URL}/forgot-password. Enter the email on your account and we'll send a link (check your spam folder too).

If you first signed up with Google, use "Sign in with Google" instead. That account has no password until you set one with the link above.

Chiyali Support`,
  },
  {
    id: "creator-payout",
    title: "Creator: when do I get paid?",
    body: `Hi {name},

Earnings from each sale become withdrawable ${payoutHoldDays} days after the sale, once its refund window has closed. When your balance reaches ${minimumPayout}, request a payout from your dashboard (Teach → Payouts)${payoutRequiresVerifiedPhone ? "; you'll need to verify your phone number first" : ""}.

Chiyali Support`,
  },
  {
    id: "delete-account",
    title: "How to delete my account",
    body: `Hi {name},

You can delete your account yourself at ${SITE_URL}/account/delete (or in the app: Account → Delete account). It signs you out everywhere and removes your personal details. We keep purchase and invoice records, as Nepal's tax law requires.

If you can't sign in, reply from the email on your account and we'll delete it for you.

Chiyali Support`,
  },
]

/** The reply's text with the customer's first name filled in. */
export function fillSavedReply(reply: SavedReply, customerName: string | null | undefined) {
  const first = customerName?.trim().split(/\s+/)[0]
  return reply.body.replaceAll("{name}", first && first !== "Deleted" ? first : "there")
}
