import type { Metadata } from "next"
import Link from "next/link"
import { LegalPage } from "@/components/LegalPage"
import { COMPANY, LEGAL_LAST_UPDATED, companyRegistrationDisplay } from "@/config/company"
import { POLICY_TERMS } from "@/config/policyTerms"
import { pageMetadata } from "@/lib/site"

export const metadata: Metadata = pageMetadata({
  title: "Privacy Policy",
  description:
    "What personal information PaperGlidr collects, why, who we share it with, how long we keep it, and your rights under Nepal's Individual Privacy Act, 2075.",
  path: "/privacy",
})

export default function PrivacyPolicyPage() {
  return (
    <LegalPage title="Privacy Policy" lastUpdated={LEGAL_LAST_UPDATED}>
      <p>
        This Privacy Policy explains how {COMPANY.legalName} (&quot;
        {COMPANY.brandName}&quot;, &quot;we&quot;, &quot;us&quot;) collects, uses, shares and
        protects personal information when you use {COMPANY.website} (the
        &quot;Platform&quot;). We handle personal information in accordance with
        the Individual Privacy Act, 2075 (2018) of Nepal and its regulations,
        and we keep electronic records in accordance with the Electronic
        Transactions Act, 2063 (2008).
      </p>
      <p>
        {COMPANY.legalName} is the party responsible for your personal
        information. Registered office: {COMPANY.registeredAddress}. Company
        registration: {companyRegistrationDisplay}. Contact:{" "}
        <a href={`mailto:${COMPANY.legalEmail}`}>{COMPANY.legalEmail}</a>.
      </p>

      <h2>1. Information we collect</h2>
      <h3>When you create an account</h3>
      <ul>
        <li>
          <strong>From Google sign-in</strong> (or GitHub, where offered): your
          name, email address, profile picture and the account identifier the
          provider gives us, along with the sign-in tokens the provider issues
          so we can keep you signed in. We never receive your Google password.
        </li>
        <li>
          <strong>Session information</strong>: when you sign in we record the
          IP address and browser/device description (user agent) of the
          session, to keep your account secure.
        </li>
      </ul>

      <h3>If you become an instructor</h3>
      <ul>
        <li>
          Your public profile: handle, display name, biography and profile
          image.
        </li>
        <li>
          Your mobile phone number, which we verify by sending a one-time code
          by SMS. We store only a one-way hash of the code, never the code
          itself.
        </li>
        <li>
          The bank or wallet details you enter when you request a payout, kept
          with that payout request.
        </li>
      </ul>

      <h3>When you buy a course</h3>
      <ul>
        <li>
          Purchase details: the course, price, any discount code used, the
          payment method (eSewa, Khalti or Fonepay) and the date.
        </li>
        <li>
          Payment references returned by the payment gateway — transaction and
          reference numbers, payment status, and the gateway&apos;s response as
          sent to us. We do <strong>not</strong> receive or store your wallet
          PIN, password, or full card details; you enter those only on the
          gateway&apos;s own page.
        </li>
        <li>
          Invoice details: your name and email address as they appear on the
          invoice we issue.
        </li>
      </ul>

      <h3>When you learn and take part</h3>
      <ul>
        <li>
          Course progress: which lessons you have completed, and certificates
          issued to you (with your name as it was when the certificate was
          issued).
        </li>
        <li>
          Content you post: reviews, questions and replies on lessons, support
          tickets, reports about content, and your wishlist.
        </li>
      </ul>

      <h3>Cookies and similar technologies</h3>
      <ul>
        <li>A session cookie that keeps you signed in.</li>
        <li>
          A referral cookie that records which instructor&apos;s link brought you
          to the Platform, kept for {POLICY_TERMS.referralWindowDays} days, so
          that instructor can be credited if you buy their course.
        </li>
        <li>Your light/dark theme preference, stored in your browser.</li>
      </ul>
      <p>We do not use advertising cookies or sell data to advertisers.</p>

      <h2>2. Why we use it</h2>
      <ul>
        <li>To create and secure your account and keep you signed in.</li>
        <li>
          To sell you courses, confirm payments with the payment gateway, give
          you access, issue invoices, and handle refunds.
        </li>
        <li>
          To run the instructor programme: verify instructors&apos; phone
          numbers, calculate earnings, and pay instructors.
        </li>
        <li>
          To track your progress, issue certificates, and let anyone you share
          a certificate with verify that it is genuine.
        </li>
        <li>
          To send service emails — invoices, replies to your questions, and
          support responses. We do not send marketing email without your
          consent.
        </li>
        <li>
          To prevent fraud and abuse, enforce our{" "}
          <Link href="/tos">Terms of Service</Link> and{" "}
          <Link href="/content">Content Policy</Link>, and comply with the law,
          including tax and accounting obligations.
        </li>
      </ul>

      <h2>3. What others can see</h2>
      <ul>
        <li>
          Instructor profiles, published courses, and instructor replies are
          public.
        </li>
        <li>
          Instructors can see the name of each person who bought their course
          on their sales page, and the name of anyone who asks a question or
          leaves a review on it.
        </li>
        <li>
          Anyone who has a certificate&apos;s verification code or QR code can see
          the certificate holder&apos;s name, the course, and the issue date. You
          choose whom to share it with.
        </li>
      </ul>

      <h2>4. Who we share it with</h2>
      <p>
        We share personal information only with service providers who process
        it for us, under their own security and confidentiality obligations,
        and only as needed for the purpose described:
      </p>
      <table>
        <thead>
          <tr>
            <th>Provider</th>
            <th>What for</th>
            <th>What they receive</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>eSewa, Khalti, Fonepay</td>
            <td>Taking your payment</td>
            <td>Order reference, amount, course name; you give them your payment details directly</td>
          </tr>
          <tr>
            <td>Google (and GitHub, where offered)</td>
            <td>Sign-in</td>
            <td>The sign-in request; they share your profile details with us</td>
          </tr>
          <tr>
            <td>Cloudflare (R2 storage)</td>
            <td>Storing course files and invoice PDFs</td>
            <td>Uploaded course files and invoices (which contain your name and email)</td>
          </tr>
          <tr>
            <td>Resend</td>
            <td>Sending email</td>
            <td>Your email address and the email&apos;s content</td>
          </tr>
          <tr>
            <td>SMSPasal</td>
            <td>Sending verification codes to instructors</td>
            <td>The instructor&apos;s phone number and the code</td>
          </tr>
          <tr>
            <td>Our hosting and database providers</td>
            <td>Running the Platform</td>
            <td>All Platform data, stored on our behalf</td>
          </tr>
        </tbody>
      </table>
      <p>
        Some of these providers process data outside Nepal. We also disclose
        information when required by Nepali law, a court order, or a
        competent authority, and to protect the rights and safety of our
        users and the Platform. We do not sell personal information.
      </p>

      <h2>5. How long we keep it</h2>
      <ul>
        <li>
          Account and profile information: for as long as your account is
          open, and deleted or anonymised after you ask us to close it, except
          as below.
        </li>
        <li>
          Purchase, payment, invoice, refund and payout records: for as long
          as Nepal&apos;s tax and accounting laws require, even after your account
          is closed.
        </li>
        <li>
          Sign-in sessions expire automatically; phone verification codes
          expire after ten minutes.
        </li>
        <li>
          Certificates remain verifiable after they are issued unless revoked,
          so that a certificate you have shared keeps working.
        </li>
      </ul>

      <h2>6. How we protect it</h2>
      <p>
        Connections to the Platform are encrypted (HTTPS). Course files are
        stored privately and served through short-lived links. Access to
        administrative functions is restricted to authorised staff, and
        payment confirmations are checked directly with the payment gateway.
        No system is perfectly secure; if we become aware of a breach
        affecting your personal information, we will notify you and the
        relevant authorities as required by law.
      </p>

      <h2>7. Your rights</h2>
      <p>
        Subject to the Individual Privacy Act, 2075 and other applicable law,
        you may ask us to:
      </p>
      <ul>
        <li>tell you what personal information we hold about you and give you a copy;</li>
        <li>correct information that is inaccurate or incomplete;</li>
        <li>
          delete your information or close your account (we will keep records
          we are legally required to keep, as described in section 5);
        </li>
        <li>stop a particular use of your information, where the law allows.</li>
      </ul>
      <p>
        Send requests to{" "}
        <a href={`mailto:${COMPANY.legalEmail}`}>{COMPANY.legalEmail}</a> from the
        email address on your account. We may need to confirm your identity
        before acting, and we will respond within a reasonable time.
      </p>

      <h2>8. Children</h2>
      <p>
        The Platform is intended for adults. Under our{" "}
        <Link href="/tos">Terms of Service</Link>, people under 18 may use it
        only with the involvement and consent of a parent or guardian, and may
        not become instructors.
      </p>

      <h2>9. Changes to this policy</h2>
      <p>
        We may update this policy. The date at the top shows when it last
        changed. We will tell you about material changes on the Platform or
        by email before they take effect.
      </p>

      <h2>10. Contact</h2>
      <p>
        Questions or complaints about privacy:{" "}
        <a href={`mailto:${COMPANY.legalEmail}`}>{COMPANY.legalEmail}</a>, or{" "}
        {COMPANY.legalName}, {COMPANY.registeredAddress}. See also our{" "}
        <Link href="/contact">contact page</Link>.
      </p>
    </LegalPage>
  )
}
