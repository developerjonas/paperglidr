import { PageHeader } from "@/components/PageHeader"

const DMCA_AGENT_EMAIL = "[email protected]"
const COMPANY_LEGAL_NAME = "Paperglidr Technology Pvt. Ltd."
const COMPANY_ADDRESS = "[Registered Office Address, Lalitpur, Nepal]"
const LAST_UPDATED = "[DATE]"

export default function DmcaPolicyPage() {
  return (
    <div className="container max-w-3xl py-8">
      <PageHeader title="DMCA & Takedown Policy" />
      <div className="prose prose-sm dark:prose-invert max-w-none mt-4">
        <p className="text-muted-foreground">Last updated: {LAST_UPDATED}</p>

        <p>
          {COMPANY_LEGAL_NAME} respects the intellectual property rights of
          others and expects users of PaperGlidr to do the same. This policy
          explains how to report content you believe infringes your
          copyright, and how we respond to such reports.
        </p>
        <p>
          <em>
            Note: PaperGlidr operates in Nepal. We follow a DMCA-style
            notice-and-takedown process as an industry-standard practice,
            without asserting that U.S. DMCA jurisdiction formally applies.
            Nepali copyright law (Copyright Act, 2059) and the Electronic
            Transaction Act also govern content on this platform.
          </em>
        </p>

        <h2>1. How to Submit a Takedown Request</h2>
        <p>
          If you believe content published on PaperGlidr infringes your
          copyright, send a written notice to{" "}
          <a href={`mailto:${DMCA_AGENT_EMAIL}`}>{DMCA_AGENT_EMAIL}</a>{" "}
          including:
        </p>
        <ul>
          <li>
            Identification of the copyrighted work you claim has been
            infringed
          </li>
          <li>
            The specific URL or course/lesson name on PaperGlidr where the
            infringing content appears
          </li>
          <li>Your contact information (name, email, and address)</li>
          <li>
            A statement that you have a good-faith belief the use is not
            authorized by the copyright owner, its agent, or the law
          </li>
          <li>
            A statement, under penalty of perjury, that the information in
            the notice is accurate and that you are the copyright owner or
            authorized to act on their behalf
          </li>
          <li>Your physical or electronic signature</li>
        </ul>

        <h2>2. What Happens Next</h2>
        <ul>
          <li>
            We review valid takedown requests and, where appropriate,
            remove or disable access to the reported content.
          </li>
          <li>
            We notify the Instructor who published the content and provide
            them the substance of the complaint.
          </li>
          <li>
            The Instructor may submit a counter-notice if they believe the
            content was removed in error (see Section 3).
          </li>
          <li>
            Accounts found to repeatedly infringe copyright will be
            terminated.
          </li>
        </ul>

        <h2>3. Counter-Notices</h2>
        <p>
          If your content was removed and you believe this was a mistake or
          misidentification, you may submit a counter-notice to{" "}
          <a href={`mailto:${DMCA_AGENT_EMAIL}`}>{DMCA_AGENT_EMAIL}</a>{" "}
          including:
        </p>
        <ul>
          <li>Identification of the content that was removed</li>
          <li>
            A statement, under penalty of perjury, that you have a
            good-faith belief the content was removed as a result of
            mistake or misidentification
          </li>
          <li>Your contact information</li>
          <li>Your physical or electronic signature</li>
        </ul>
        <p>
          We may reinstate the content if we do not receive notice of legal
          action from the original complainant within a reasonable period
          after the counter-notice.
        </p>

        <h2>4. Repeat Infringers</h2>
        <p>
          PaperGlidr will terminate, in appropriate circumstances, the
          accounts of Instructors who are repeat infringers of intellectual
          property rights.
        </p>

        <h2>5. False Claims</h2>
        <p>
          Submitting a false or bad-faith takedown request may expose you to
          liability. Please ensure your claim is accurate before submitting
          it.
        </p>

        <h2>6. Designated Contact</h2>
        <p>
          {COMPANY_LEGAL_NAME}
          <br />
          {COMPANY_ADDRESS}
          <br />
          Email: <a href={`mailto:${DMCA_AGENT_EMAIL}`}>{DMCA_AGENT_EMAIL}</a>
        </p>
      </div>
    </div>
  )
}
