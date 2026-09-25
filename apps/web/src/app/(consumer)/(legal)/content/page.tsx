import type { Metadata } from "next"
import Link from "next/link"
import { LegalPage } from "@/components/LegalPage"
import { COMPANY, LEGAL_LAST_UPDATED } from "@/config/company"
import { POLICY_TERMS } from "@/config/policyTerms"
import { pageMetadata } from "@/lib/site"

export const metadata: Metadata = pageMetadata({
  title: "Content Policy",
  description: "What creators may and may not publish on Chiyali, and what students may do with courses they buy.",
  path: "/content",
})

export default function ContentPolicyPage() {
  return (
    <LegalPage title="Content Policy" lastUpdated={LEGAL_LAST_UPDATED}>
      <p>
        This policy sets the rules for what instructors may publish on{" "}
        {COMPANY.brandName} and what students may do with courses they buy.
        It forms part of our <Link href="/tos">Terms of Service</Link> and{" "}
        <Link href="/creator-terms">Creator Terms</Link>.
      </p>

      <h2>1. What you may publish</h2>
      <ul>
        <li>
          Educational content you created yourself — video lessons, PDFs,
          slides, worksheets, source files.
        </li>
        <li>
          Material you have written permission to sell commercially, if it is
          not wholly your own.
        </li>
        <li>
          Titles, descriptions, thumbnails and previews that accurately show
          what a student will get.
        </li>
      </ul>

      <h2>2. What you may not publish</h2>
      <ul>
        <li>
          <strong>Pirated or unlicensed material</strong> — content copied
          from other paid courses, coaching-centre classes, textbooks or other
          platforms without permission, or carrying someone else&apos;s
          watermark or branding.
        </li>
        <li>
          <strong>Repackaged free content</strong> — freely available material
          (public videos, open documentation) sold as a paid course without
          substantial original work of your own.
        </li>
        <li>
          <strong>Material that infringes others&apos; rights</strong> —
          copyrighted text, images, music or footage used without a licence,
          including leaked or confidential exam papers.
        </li>
        <li>
          <strong>Misleading courses</strong> — courses that don&apos;t deliver
          what their title or description promises, guaranteed exam results
          or job placements you cannot back up, content padded to look
          longer, or courses that are substantially incomplete.
        </li>
        <li>
          <strong>Unlawful or harmful content</strong> — anything illegal
          under the laws of Nepal, hate speech, harassment or content that
          targets individuals, sexual content, or content that exploits
          minors in any way.
        </li>
        <li>
          <strong>Malicious files</strong> — downloads must be safe. Uploading
          malware or files designed to harm a student&apos;s device leads to
          immediate account closure.
        </li>
        <li>
          <strong>Payment or data grabs</strong> — asking students to pay you
          outside the Platform, or to hand over passwords or payment details.
        </li>
      </ul>

      <h2>3. Before a course can go on sale</h2>
      <p>The Platform checks that each product you publish has:</p>
      <ul>
        <li>a thumbnail image and a price;</li>
        <li>
          a description of at least {POLICY_TERMS.minDescriptionLength}{" "}
          characters;
        </li>
        <li>at least one course in it; and</li>
        <li>
          at least one lesson marked as a free <strong>preview</strong> with a
          video (YouTube or an uploaded file), so students can see what they
          are buying.
        </li>
      </ul>
      <p>
        There is also a limit on how many products you can have on sale (or
        waiting for review) at once, which rises when you verify your phone
        number.
      </p>
      <p>
        When you choose to publish, the product is sent to our team for
        review and goes on sale once approved. If we can&apos;t approve it, we
        tell you why by email and in your dashboard, and you can fix it and
        resubmit. A review is a check against this policy, not an endorsement
        or a guarantee of quality: you remain responsible for your content,
        and we may still remove it later.
      </p>

      <h2>4. What students may do with a course they bought</h2>
      <ul>
        <li>Watch and use it for their own, non-commercial learning.</li>
        <li>
          Download attachments the instructor has marked as downloadable, for
          personal use only.
        </li>
      </ul>

      <h2>5. What students may not do</h2>
      <ul>
        <li>
          Share, resell, upload elsewhere or publicly post a course or any
          part of it, including downloaded files.
        </li>
        <li>Share their account so others can watch.</li>
        <li>Circumvent access restrictions or download protections.</li>
      </ul>
      <p>
        Breaking these rules can lead to losing access without a refund,
        account closure and, where appropriate, legal action by the
        instructor or by us.
      </p>

      <h2>6. Reporting a problem</h2>
      <p>
        To report a course or lesson that breaks this policy, use the
        &quot;Report&quot; button on its page, open a{" "}
        <Link href="/support/new">support ticket</Link> or email{" "}
        <a href={`mailto:${COMPANY.supportEmail}`}>{COMPANY.supportEmail}</a>{" "}
        with a link to the course and what is wrong. Copyright complaints
        follow our <Link href="/dmca">DMCA &amp; Takedown Policy</Link> and go
        to{" "}
        <a href={`mailto:${COMPANY.legalEmail}`}>{COMPANY.legalEmail}</a>. We
        review every report and may unpublish content while we investigate.
      </p>

      <h2>7. Enforcement</h2>
      <p>
        Depending on how serious the breach is and whether it has happened
        before, we may remove content, suspend or close accounts, refund
        affected students, and hold or refuse payouts connected to the
        content, as described in the Creator Terms.
      </p>
    </LegalPage>
  )
}
