import type { Metadata } from "next"
import Link from "next/link"
import { LegalPage } from "@/components/LegalPage"
import { COMPANY, LEGAL_LAST_UPDATED } from "@/config/company"
import { POLICY_TERMS } from "@/config/policyTerms"
import { pageMetadata } from "@/lib/site"

const {
  platformFeePercent,
  creatorSharePercent,
  referralWindowDays,
  minimumPayout,
  payoutHoldDays,
  payoutRequiresVerifiedPhone,
  refundWindowDays,
  refundCompletionThresholdPercent,
} = POLICY_TERMS

export const metadata: Metadata = pageMetadata({
  title: "Creator Terms",
  description:
    "The terms for publishing and selling courses on Chiyali: content rights, prohibited content, the platform fee, payouts, refunds and takedowns.",
  path: "/creator-terms",
})

export default function CreatorTermsPage() {
  return (
    <LegalPage title="Creator Terms" lastUpdated={LEGAL_LAST_UPDATED}>
      <p>
        These Creator Terms apply when you publish or sell a course on{" "}
        {COMPANY.brandName} as an instructor (&quot;Creator&quot;, &quot;you&quot;). They
        add to our <Link href="/tos">Terms of Service</Link>,{" "}
        <Link href="/content">Content Policy</Link> and{" "}
        <Link href="/privacy">Privacy Policy</Link>, which also apply to you.
        By creating an instructor profile you agree to them with{" "}
        {COMPANY.legalName} (&quot;{COMPANY.brandName}&quot;, &quot;we&quot;, &quot;us&quot;).
      </p>

      <h2>1. Becoming a creator</h2>
      <ul>
        <li>You must be at least 18 and able to enter a binding contract.</li>
        <li>
          Your instructor profile (name, handle, biography, photo) must be
          accurate and must not impersonate anyone.
        </li>
        <li>
          Verifying your mobile number raises the number of courses and live
          products you can publish. The current limits are shown in your
          creator dashboard.
          {payoutRequiresVerifiedPhone &&
            " A verified mobile number is also required before you can request a payout (section 6)."}
        </li>
        <li>
          You act as an independent creator, not as our employee, agent or
          partner.
        </li>
      </ul>

      <h2>2. Your content and your rights</h2>
      <ul>
        <li>
          <strong>You keep ownership</strong> of the courses you create. We do
          not claim ownership of your content.
        </li>
        <li>
          <strong>Rights you confirm.</strong> Each time you publish, you
          confirm that you own the content or have every licence and
          permission needed to sell it on {COMPANY.brandName} — including for
          any music, images, software, text or other people who appear in it
          — and that it does not infringe anyone&apos;s copyright, trademark,
          privacy or other rights.
        </li>
        <li>
          <strong>Licence to us.</strong> You give {COMPANY.legalName} a
          non-exclusive, worldwide, royalty-free licence to host, store,
          stream, reproduce, format and display your content in order to
          operate the Platform, sell it to students and deliver it to them,
          and to use your course titles, descriptions, thumbnails, preview
          lessons, name and profile to promote your courses and the Platform.
        </li>
        <li>
          <strong>Licence to students.</strong> A student who buys your course
          receives a personal, non-transferable licence to access it on the
          Platform for their own learning, as described in the Terms of
          Service.
        </li>
      </ul>

      <h2>3. What you may not publish</h2>
      <p>
        Everything in our <Link href="/content">Content Policy</Link> applies.
        In particular, you may not publish pirated or re-uploaded content from
        other creators or coaching centres, leaked or copyrighted exam
        material you have no right to distribute, content that is unlawful
        in Nepal, misleading course descriptions or promised results, or
        anything designed to collect students&apos; payment or login details.
      </p>

      <h2>4. Prices and discounts</h2>
      <ul>
        <li>You set your course price in Nepalese Rupees (NPR).</li>
        <li>
          You may create discount codes for your own products. A code applies
          only to your products, never to another creator&apos;s.
        </li>
        <li>
          Students pay through the payment methods available at checkout
          (eSewa, Khalti, Fonepay). {COMPANY.brandName} collects every
          payment; students never pay you directly.
        </li>
      </ul>

      <h2>5. The platform fee</h2>
      <p>
        For every paid sale, {COMPANY.brandName} keeps a platform fee from the
        amount the student actually paid (after any discount) and credits the
        rest to you:
      </p>
      <table>
        <thead>
          <tr>
            <th>How the student found your course</th>
            <th>Platform fee</th>
            <th>Your share</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              Through your own referral link (a link with{" "}
              <code>?ref=your-handle</code>), within {referralWindowDays} days of
              clicking it
            </td>
            <td>{platformFeePercent.referralLink}%</td>
            <td>{creatorSharePercent.referralLink}%</td>
          </tr>
          <tr>
            <td>Any other way (search, browsing, our promotion)</td>
            <td>{platformFeePercent.platform}%</td>
            <td>{creatorSharePercent.platform}%</td>
          </tr>
        </tbody>
      </table>
      <ul>
        <li>
          If a student clicked more than one creator&apos;s referral link, the
          most recent click counts.
        </li>
        <li>
          If one purchase includes several of your courses, the amount paid is
          divided equally between those courses before the fee is applied.
        </li>
        <li>
          We may change the fee for future sales by giving you notice through
          the Platform or by email before the change takes effect. Sales
          already made keep the fee that applied when they were made.
        </li>
        <li>
          You are responsible for your own taxes on your earnings.
        </li>
      </ul>

      <h2>6. Payouts</h2>
      <ul>
        <li>
          Your <strong>available balance</strong> is your share of your sales
          whose refund window has closed — earnings from a sale become
          available <strong>{payoutHoldDays} days</strong> after the purchase —
          minus refunds, minus payouts already paid, minus payout requests
          still being processed. Earnings from more recent sales are shown as
          on hold.
        </li>
        <li>
          You can request a payout from your{" "}
          <Link href="/teach/payouts">creator dashboard</Link> once your
          available balance reaches at least <strong>{minimumPayout}</strong>.
          Each request must be for at least that amount.
          {payoutRequiresVerifiedPhone &&
            " You must have verified your mobile number in your instructor profile to request a payout."}
        </li>
        <li>
          Payouts are <strong>processed manually</strong> by our team and paid
          in NPR, by bank transfer or to an eSewa or Khalti wallet, to the
          details you give in the request. Please check them carefully; we are not responsible for a
          payment sent to incorrect details you provided.
        </li>
        <li>
          We may hold or refuse a payout request — for example while a sale is
          being disputed, if we suspect fraud, or if the content breaks these
          terms. If we refuse a request, we tell you why in your dashboard.
        </li>
      </ul>

      <h2>7. Refunds and your earnings</h2>
      <ul>
        <li>
          Students can get a refund under our{" "}
          <Link href="/refund-policy">Refund Policy</Link> — within{" "}
          {refundWindowDays} days of purchase, if they have completed less
          than {refundCompletionThresholdPercent}% of the course — and in the
          other cases that policy describes.
        </li>
        <li>
          When a sale is refunded, your share of that sale is deducted from
          your balance. If you have already been paid for that sale, the
          deduction comes out of your future earnings.
        </li>
      </ul>

      <h2>8. Takedowns and enforcement</h2>
      <ul>
        <li>
          We may unpublish or remove a course, or disable access to it, when
          we receive a valid copyright notice under our{" "}
          <Link href="/dmca">DMCA &amp; Takedown Policy</Link>, when it breaks
          these terms or the Content Policy, or when the law requires it. Where
          appropriate we will tell you why and give you a chance to respond,
          including by counter-notice.
        </li>
        <li>
          We may suspend or close the account of a creator who repeatedly or
          seriously breaks these terms, including repeat copyright infringers.
        </li>
        <li>
          If a course is removed for breaking these terms, we may refund its
          students and deduct those refunds from your balance.
        </li>
      </ul>

      <h2>9. Leaving the Platform</h2>
      <p>
        You can unpublish your courses at any time; they will no longer be
        sold. Students who have already bought a course keep access to it as
        described in the Terms of Service. Your remaining balance of at least{" "}
        {minimumPayout} will be paid out on request, subject to section 6.
      </p>

      <h2>10. Changes and contact</h2>
      <p>
        We may update these terms; the date at the top shows the latest
        version, and we will notify creators of material changes before they
        take effect. These terms are governed by the laws of Nepal. Questions:{" "}
        <a href={`mailto:${COMPANY.supportEmail}`}>{COMPANY.supportEmail}</a>{" "}
        (general) or{" "}
        <a href={`mailto:${COMPANY.legalEmail}`}>{COMPANY.legalEmail}</a>{" "}
        (legal and copyright).
      </p>
    </LegalPage>
  )
}
