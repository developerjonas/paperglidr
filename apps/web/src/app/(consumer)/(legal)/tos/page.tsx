import type { Metadata } from "next"
import Link from "next/link"
import { LegalPage } from "@/components/LegalPage"
import {
  COMPANY,
  LEGAL_LAST_UPDATED,
  companyPanDisplay,
  companyRegistrationDisplay,
} from "@/config/company"
import { POLICY_TERMS } from "@/config/policyTerms"
import { pageMetadata } from "@/lib/site"

export const metadata: Metadata = pageMetadata({
  title: "Terms of Service",
  description: "The terms that govern using Chiyali as a student or a creator.",
  path: "/tos",
})

export default function TermsOfServicePage() {
  return (
    <LegalPage title="Terms of Service" lastUpdated={LEGAL_LAST_UPDATED}>
      <p>
        These Terms of Service (&quot;Terms&quot;) govern your access to and use
        of {COMPANY.brandName} at {COMPANY.website} (the &quot;Platform&quot;),
        operated by {COMPANY.legalName} (&quot;{COMPANY.brandName}&quot;,
        &quot;we&quot;, &quot;us&quot;), a company incorporated in Nepal with its
        registered office at {COMPANY.registeredAddress} (company
        registration: {companyRegistrationDisplay}; PAN: {companyPanDisplay}).
      </p>
      <p>
        By creating an account, buying a course, or publishing content, you
        agree to these Terms and to the policies they refer to. You accept
        them electronically, which has the same effect as a signed agreement
        under the Electronic Transactions Act, 2063 (2008) of Nepal. If you do
        not agree, do not use the Platform.
      </p>

      <h2>1. What {COMPANY.brandName} is</h2>
      <p>
        {COMPANY.brandName} is a marketplace where independent creators
        (&quot;Instructors&quot;) publish and sell educational content
        (&quot;Courses&quot;) — video lessons, PDFs and other digital materials —
        to learners, priced in Nepalese Rupees (NPR). We run the Platform and
        collect payments; Instructors create and are responsible for their
        Courses. We do not author Course content and do not guarantee any
        particular learning or exam result.
      </p>

      <h2>2. Your account</h2>
      <ul>
        <li>
          You sign in with a supported provider (such as Google). Keep your
          account secure; you are responsible for activity on it.
        </li>
        <li>
          You must be at least 18 to buy courses or become an Instructor.
          People under 18 may use the Platform only with the involvement and
          consent of a parent or guardian.
        </li>
        <li>Give accurate information, and do not share your account.</li>
      </ul>

      <h2>3. Buying a course</h2>
      <ul>
        <li>
          Prices are set by Instructors in NPR and shown before you pay. You
          pay through eSewa, Khalti or Fonepay on the payment provider&apos;s own
          page; we never receive your wallet PIN, password or card details.
        </li>
        <li>
          Your purchase is confirmed only once the payment provider confirms
          we received the full price. If a payment cannot be matched to your
          order, we hold it for review rather than grant access.
        </li>
        <li>
          A purchase gives you a personal, non-transferable, non-exclusive
          licence to access the Course on the Platform for your own learning.
          It does not transfer ownership of the content. Your access
          continues if the Instructor later stops selling the Course.
        </li>
        <li>
          We issue an electronic invoice for every paid purchase.
        </li>
      </ul>

      <h2>4. Refunds</h2>
      <p>
        You can get a refund within {POLICY_TERMS.refundWindowDays} days of
        purchase if you have completed less than{" "}
        {POLICY_TERMS.refundCompletionThresholdPercent}% of the Course, as set
        out in full in our <Link href="/refund-policy">Refund Policy</Link>.
        Refunds go back through the payment method you used.
      </p>

      <h2>5. Instructors</h2>
      <p>
        If you publish Courses, our{" "}
        <Link href="/creator-terms">Creator Terms</Link> also apply to you,
        including the platform fee, payouts and your promise that you have
        the rights to what you publish. All content must follow our{" "}
        <Link href="/content">Content Policy</Link>.
      </p>

      <h2>6. What you may not do</h2>
      <ul>
        <li>Upload, sell or share pirated or unlicensed content.</li>
        <li>
          Share, resell, publicly post or otherwise redistribute Course
          content you bought, including downloadable files.
        </li>
        <li>
          Circumvent access controls, download restrictions or payment
          systems, or try to obtain a Course without paying for it.
        </li>
        <li>
          Upload anything unlawful, fraudulent, defamatory, harassing,
          harmful to devices, or that infringes someone else&apos;s rights.
        </li>
        <li>
          Access the Platform with bots or scrapers, or interfere with its
          operation or security, without our written permission.
        </li>
      </ul>

      <h2>7. Intellectual property</h2>
      <p>
        Instructors own their Courses. The {COMPANY.brandName} name, logo and
        Platform software belong to us. If you believe content on the Platform
        infringes your copyright, follow our{" "}
        <Link href="/dmca">DMCA &amp; Takedown Policy</Link>.
      </p>

      <h2>8. Suspension and termination</h2>
      <p>
        We may remove content, or suspend or close an account, that breaks
        these Terms, our policies or the law, with notice where appropriate
        and without notice where the breach is serious or the law requires
        it. You may close your account at any time by contacting us; our{" "}
        <Link href="/privacy">Privacy Policy</Link> explains what happens to
        your data.
      </p>

      <h2>9. Disclaimers and liability</h2>
      <p>
        The Platform is provided &quot;as is&quot; and &quot;as available&quot;. To the
        fullest extent permitted by the laws of Nepal, we are not liable for
        indirect or consequential loss, for the content or conduct of
        Instructors or other users, or for failures of third-party services
        such as payment providers. Our total liability to you for any claim
        is limited to the amount you paid us in the six months before the
        claim arose. Nothing in these Terms excludes liability that cannot be
        excluded under Nepali law.
      </p>

      <h2>10. Changes</h2>
      <p>
        We may update these Terms. The date at the top shows the current
        version. We will tell you about material changes on the Platform or
        by email before they take effect; continuing to use the Platform
        afterwards means you accept them.
      </p>

      <h2>11. Governing law and disputes</h2>
      <p>
        These Terms are governed by the laws of Nepal. Please contact us
        first so we can try to resolve any dispute informally. Disputes that
        cannot be resolved that way are subject to the jurisdiction of the
        competent courts of Nepal.
      </p>

      <h2>12. Contact</h2>
      <p>
        {COMPANY.legalName}, {COMPANY.registeredAddress}. General questions:{" "}
        <a href={`mailto:${COMPANY.supportEmail}`}>{COMPANY.supportEmail}</a>.
        Legal notices:{" "}
        <a href={`mailto:${COMPANY.legalEmail}`}>{COMPANY.legalEmail}</a>. See
        also our <Link href="/contact">contact page</Link> and{" "}
        <Link href="/legal">all policies</Link>.
      </p>
    </LegalPage>
  )
}
