import { PageHeader } from "@/components/PageHeader"



// PLACEHOLDER FIELDS — fill in before launch:
const COMPANY_LEGAL_NAME = "Paperglidr Technology Pvt. Ltd."
const COMPANY_REGISTRATION = "[Company Registration Number — Office of Company Registrar, Lalitpur]"
const COMPANY_ADDRESS = "[Registered Office Address, Lalitpur, Nepal]"
const SUPPORT_EMAIL = "[email protected]"
const LAST_UPDATED = "[DATE]"

export default function TermsOfServicePage() {
  return (
    <div className="container max-w-3xl py-8">
      <PageHeader title="Terms of Service" />
      <div className="prose prose-sm dark:prose-invert max-w-none mt-4">
        <p className="text-muted-foreground">Last updated: {LAST_UPDATED}</p>

        <p>
          These Terms of Service ("Terms") govern your access to and use of
          PaperGlidr (paperglidr.com), a platform operated by{" "}
          {COMPANY_LEGAL_NAME} ("PaperGlidr", "we", "us"), registered at{" "}
          {COMPANY_ADDRESS} under registration number{" "}
          {COMPANY_REGISTRATION}. By creating an account, purchasing a
          course, or publishing content as an instructor, you agree to these
          Terms.
        </p>

        <h2>1. What PaperGlidr Is</h2>
        <p>
          PaperGlidr is a self-serve marketplace that lets independent
          creators ("Instructors") publish and sell educational content
          ("Courses") — including video lessons, PDFs, and other digital
          materials — to students in Nepal and elsewhere, priced in Nepalese
          Rupees (NPR) and paid for via eSewa, Khalti, or Fonepay. PaperGlidr
          is a platform, not the creator of Course content; Instructors are
          independently responsible for what they publish.
        </p>

        <h2>2. Accounts</h2>
        <ul>
          <li>
            You must provide accurate information when creating an account
            and keep your login credentials secure.
          </li>
          <li>
            You must be at least 18 years old, or the age of majority in
            your jurisdiction, to create an Instructor account or make a
            purchase. Users under this age may use PaperGlidr only with the
            involvement and consent of a parent or guardian.
          </li>
          <li>
            We may suspend or terminate accounts that violate these Terms,
            our Content Policy, or applicable law, with or without notice
            depending on severity.
          </li>
        </ul>

        <h2>3. Purchases &amp; Payments</h2>
        <ul>
          <li>
            Course prices are set by Instructors in NPR and displayed before
            purchase. Payment is processed through eSewa, Khalti, or Fonepay
            — PaperGlidr does not store your full payment card or wallet
            credentials.
          </li>
          <li>
            A purchase grants you a personal, non-transferable license to
            access the Course content for your own learning. It does not
            transfer ownership of the content to you.
          </li>
          <li>
            Refunds are handled under our refund policy (see Section 6) —
            courses with less than 20% completion are eligible for a refund
            within 7 days of purchase. Refund requests outside this window
            are reviewed case by case.
          </li>
        </ul>

        <h2>4. Instructor Content &amp; Responsibilities</h2>
        <ul>
          <li>
            By publishing a Course, you confirm you own the rights to the
            content or have permission to distribute it, and that it does
            not infringe on any third party's copyright, trademark, or
            other rights.
          </li>
          <li>
            Instructors are solely responsible for the accuracy, legality,
            and quality of their Course content. See our{" "}
            <a href="/legal/content-policy">Content Policy</a> for specific
            rules on what may and may not be published.
          </li>
          <li>
            PaperGlidr retains a commission on each sale, as disclosed to
            Instructors at the time of publishing or in the Instructor
            dashboard. Payouts are subject to the minimum threshold and
            process described in the Instructor payout terms.
          </li>
        </ul>

        <h2>5. Prohibited Conduct</h2>
        <p>You may not use PaperGlidr to:</p>
        <ul>
          <li>Upload, sell, or redistribute pirated or unlicensed content</li>
          <li>
            Share, resell, or redistribute purchased Course content outside
            the platform
          </li>
          <li>
            Attempt to circumvent access controls, download restrictions, or
            payment systems
          </li>
          <li>
            Upload content that is unlawful, fraudulent, defamatory, or that
            infringes another party's intellectual property
          </li>
          <li>
            Use automated means (bots, scrapers) to access the platform
            without our written permission
          </li>
        </ul>

        <h2>6. Refund Policy</h2>
        <p>
          Courses with less than 20% completion may be refunded within 7
          days of purchase. To request a refund, contact{" "}
          <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>. Refunds
          are issued to the original payment method where supported by the
          payment gateway used.
        </p>

        <h2>7. Intellectual Property &amp; Copyright</h2>
        <p>
          PaperGlidr respects intellectual property rights and expects the
          same from its users. If you believe your copyrighted work has been
          uploaded without authorization, see our{" "}
          <a href="/legal/dmca">DMCA &amp; Takedown Policy</a>.
        </p>

        <h2>8. Limitation of Liability</h2>
        <p>
          PaperGlidr is provided "as is." To the maximum extent permitted by
          applicable law, PaperGlidr is not liable for indirect,
          incidental, or consequential damages arising from your use of the
          platform, including but not limited to Course content quality,
          instructor conduct, or third-party payment gateway issues.
        </p>

        <h2>9. Changes to These Terms</h2>
        <p>
          We may update these Terms from time to time. Material changes will
          be communicated via the platform or email. Continued use of
          PaperGlidr after changes take effect constitutes acceptance of the
          revised Terms.
        </p>

        <h2>10. Governing Law</h2>
        <p>
          These Terms are governed by the laws of Nepal. Any disputes shall
          be subject to the exclusive jurisdiction of the courts of Nepal.
        </p>

        <h2>11. Contact</h2>
        <p>
          Questions about these Terms can be sent to{" "}
          <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
        </p>
      </div>
    </div>
  )
}
