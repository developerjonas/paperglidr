import type { Metadata } from "next"
import Link from "next/link"
import { LegalPage } from "@/components/LegalPage"
import { COMPANY, LEGAL_LAST_UPDATED } from "@/config/company"
import { POLICY_TERMS } from "@/config/policyTerms"
import { pageMetadata } from "@/lib/site"

const { refundWindowDays, refundWindowHours, refundCompletionThresholdPercent } = POLICY_TERMS

export const metadata: Metadata = pageMetadata({
  title: "Refund Policy",
  description: `When you can get a refund on a PaperGlidr course (within ${refundWindowDays} days and less than ${refundCompletionThresholdPercent}% completed), how to ask, and how the money comes back.`,
  path: "/refund-policy",
})

export default function RefundPolicyPage() {
  return (
    <LegalPage title="Refund Policy" lastUpdated={LEGAL_LAST_UPDATED}>
      <p>
        This policy explains when you can get your money back for a course you
        bought on {COMPANY.brandName}. It forms part of our{" "}
        <Link href="/tos">Terms of Service</Link>.
      </p>

      <h2>1. When you can get a refund</h2>
      <p>A purchase is eligible for a refund when both of these are true:</p>
      <ol>
        <li>
          <strong>
            You ask within {refundWindowDays} days ({refundWindowHours} hours)
          </strong>{" "}
          of the moment you placed the order. The window is counted to the
          minute from the time shown on your order — not by calendar days.
        </li>
        <li>
          <strong>
            You have completed less than {refundCompletionThresholdPercent}%
          </strong>{" "}
          of the course&apos;s lessons. Completion is the number of lessons marked
          complete divided by the total number of lessons in the course.
          Exactly {refundCompletionThresholdPercent}% or more is not eligible.
        </li>
      </ol>
      <p>
        Eligibility is judged at the moment you make your request: completing
        more lessons after you ask does not change the outcome.
      </p>
      <p>
        If one purchase includes several courses (a bundle), the rule applies
        to the courses in that purchase taken together.
      </p>

      <h2>2. What is not refundable</h2>
      <ul>
        <li>
          Purchases outside the {refundWindowDays}-day window, or with{" "}
          {refundCompletionThresholdPercent}% or more of the lessons completed.
        </li>
        <li>
          Courses you received free, including with a 100% discount code —
          no money was paid.
        </li>
      </ul>
      <p>
        We may still refund a purchase outside these conditions at our
        discretion — for example, if a course is materially different from
        its description, cannot be accessed because of a problem on our side,
        or is removed for breaking our{" "}
        <Link href="/content">Content Policy</Link>. Nothing in this policy
        limits any right you have under the consumer protection laws of Nepal.
      </p>

      <h2>3. How to ask for a refund</h2>
      <ol>
        <li>
          Open a support ticket at{" "}
          <Link href="/support/new">paperglidr.com/support/new</Link> (choose
          &quot;Billing &amp; Payments&quot;), or email{" "}
          <a href={`mailto:${COMPANY.supportEmail}`}>{COMPANY.supportEmail}</a>{" "}
          from the email address on your account.
        </li>
        <li>
          Include the course name and your purchase reference (shown on your{" "}
          <Link href="/purchases">purchase history</Link>), and tell us briefly
          why. A reason is not required for an eligible refund; it helps us
          improve.
        </li>
        <li>
          We check eligibility against the time of your order and your lesson
          progress, and reply to confirm the outcome.
        </li>
      </ol>

      <h2>4. How the money comes back</h2>
      <ul>
        <li>
          Refunds go back through the <strong>same payment method</strong> you
          used — to the same eSewa or Khalti account, or through Fonepay to
          the same bank account. We cannot refund to a different account,
          in cash, or as store credit.
        </li>
        <li>
          The amount refunded is what you actually paid, after any discount.
        </li>
        <li>
          Once a refund is approved, your access to the course ends and any
          certificate for it may be revoked.
        </li>
        <li>
          After we issue the refund, the payment provider decides how long it
          takes to reach you.
        </li>
      </ul>

      <h2>5. Charged but no access?</h2>
      <p>
        That is not a refund request — it is a payment we still need to
        confirm. Payments are normally confirmed within a few minutes, even
        if you closed the payment page early. If your course has not appeared
        after that, open a support ticket with your purchase reference and we
        will check the payment directly with the payment provider.
      </p>

      <h2>6. Contact</h2>
      <p>
        Questions about refunds:{" "}
        <a href={`mailto:${COMPANY.supportEmail}`}>{COMPANY.supportEmail}</a>.
        See also our <Link href="/contact">contact page</Link>.
      </p>
    </LegalPage>
  )
}
