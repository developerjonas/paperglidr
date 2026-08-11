import { PageHeader } from "@/components/PageHeader"

const SUPPORT_EMAIL = "[email protected]"
const LAST_UPDATED = "[DATE]"

export default function ContentPolicyPage() {
  return (
    <div className="container max-w-3xl py-8">
      <PageHeader title="Content Policy" />
      <div className="prose prose-sm dark:prose-invert max-w-none mt-4">
        <p className="text-muted-foreground">Last updated: {LAST_UPDATED}</p>

        <p>
          This Content Policy sets the rules for what Instructors may
          publish on PaperGlidr, and what buyers may do with content they
          purchase. It works alongside our{" "}
          <a href="/legal/terms">Terms of Service</a>.
        </p>

        <h2>1. What You May Publish</h2>
        <ul>
          <li>
            Original educational content you created yourself (video
            lessons, PDFs, slides, worksheets, source files).
          </li>
          <li>
            Content you have explicit, documented permission to distribute
            commercially, if not fully original.
          </li>
          <li>
            Content that accurately represents what a buyer will receive —
            course titles, descriptions, and thumbnails must not be
            misleading.
          </li>
        </ul>

        <h2>2. What You May Not Publish</h2>
        <ul>
          <li>
            <strong>Pirated or unlicensed material</strong> — including
            content copied from other paid courses, textbooks, or platforms
            without permission, and content bearing another creator's
            watermark or branding.
          </li>
          <li>
            <strong>Reselling of others' free content</strong> — repackaging
            freely available material (e.g., public YouTube tutorials,
            open-source documentation) as a paid course without meaningful
            original contribution.
          </li>
          <li>
            <strong>Content that infringes intellectual property</strong> —
            copyrighted text, images, music, or footage used without a
            license or valid fair-use basis.
          </li>
          <li>
            <strong>Deceptive or low-effort content</strong> — courses that
            don't deliver on their stated title/description, filler content
            padded to appear longer than it is, or content that is
            substantially incomplete at publish time.
          </li>
          <li>
            <strong>Unlawful, harmful, or exploitative content</strong> —
            anything illegal under Nepali law, content that harasses or
            targets individuals, or content involving minors in violation
            of applicable child protection law.
          </li>
          <li>
            <strong>Malware or harmful files</strong> — any downloadable
            attachment must be safe; uploading executables or files designed
            to harm a buyer's device is grounds for immediate termination.
          </li>
        </ul>

        <h2>3. Publishing Requirements</h2>
        <p>Before a course can go live, it must include:</p>
        <ul>
          <li>A thumbnail image representing the course</li>
          <li>A description sufficient to explain what the course covers</li>
          <li>At least one category/tag</li>
          <li>
            At minimum one piece of published lesson content (video, PDF,
            or other supported asset)
          </li>
        </ul>
        <p>
          Courses that don't meet these requirements will not be visible to
          buyers until completed.
        </p>

        <h2>4. What Buyers May Do With Purchased Content</h2>
        <ul>
          <li>
            Access purchased Course content for personal, non-commercial
            learning use.
          </li>
          <li>
            Download attachments explicitly marked as downloadable by the
            Instructor, for personal use only.
          </li>
        </ul>

        <h2>5. What Buyers May Not Do</h2>
        <ul>
          <li>
            Share, resell, redistribute, or publicly post purchased content,
            in whole or in part, including downloadable PDFs and
            attachments.
          </li>
          <li>
            Attempt to circumvent access restrictions, download protections,
            or watermarking on purchased content.
          </li>
        </ul>
        <p>
          Downloadable files may be traceable to the purchasing account.
          Violation of this section may result in account termination and,
          where applicable, legal action.
        </p>

        <h2>6. Reporting a Violation</h2>
        <p>
          Any user can report a Course that appears to violate this policy
          using the report/flag option on the course page, or by emailing{" "}
          <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>. Reports
          are reviewed by our team; we may remove content, suspend accounts,
          or take other action as appropriate while a report is
          investigated.
        </p>

        <h2>7. Copyright Claims</h2>
        <p>
          If you believe content on PaperGlidr infringes your copyright, see
          our <a href="/legal/dmca">DMCA &amp; Takedown Policy</a> for how
          to submit a claim.
        </p>

        <h2>8. Enforcement</h2>
        <p>
          Violations of this Content Policy may result in content removal,
          account suspension, forfeiture of pending payouts related to the
          violating content, or permanent termination, depending on
          severity and whether the violation is repeated.
        </p>
      </div>
    </div>
  )
}
