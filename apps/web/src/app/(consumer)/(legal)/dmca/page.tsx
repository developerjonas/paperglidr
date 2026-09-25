import type { Metadata } from "next"
import Link from "next/link"
import { LegalPage } from "@/components/LegalPage"
import { COMPANY, LEGAL_LAST_UPDATED } from "@/config/company"
import { pageMetadata } from "@/lib/site"

export const metadata: Metadata = pageMetadata({
  title: "DMCA & Takedown Policy",
  description: "How to report content that infringes your copyright, and how Chiyali responds.",
  path: "/dmca",
})

export default function DmcaPolicyPage() {
  const legalEmail = (
    <a href={`mailto:${COMPANY.legalEmail}`}>{COMPANY.legalEmail}</a>
  )
  return (
    <LegalPage title="DMCA & Takedown Policy" lastUpdated={LEGAL_LAST_UPDATED}>
      <p>
        {COMPANY.legalName} respects the intellectual property rights of
        others and expects everyone who uses {COMPANY.brandName} to do the
        same. This policy explains how to tell us about content you believe
        infringes your copyright, and what we do about it.
      </p>
      <p>
        {COMPANY.brandName} operates in Nepal, where copyright is governed by
        the Copyright Act, 2059 (2002), and electronic records by the
        Electronic Transactions Act, 2063 (2008). We follow a
        notice-and-takedown process modelled on the widely used &quot;DMCA&quot;
        approach because it is familiar to rights-holders; we do not suggest
        that United States law applies.
      </p>

      <h2>1. Reporting infringing content</h2>
      <p>Email {legalEmail} with:</p>
      <ol>
        <li>your name, postal address, phone number and email address;</li>
        <li>
          the copyrighted work you say is being infringed (or, for several
          works, a representative list);
        </li>
        <li>
          where it appears on {COMPANY.brandName} — the course or lesson link,
          or its name and instructor — in enough detail for us to find it;
        </li>
        <li>
          a statement that you believe in good faith that the use is not
          authorised by the copyright owner, its agent or the law;
        </li>
        <li>
          a statement that the information in your notice is accurate and
          that you own the copyright or are authorised to act for the owner;
          and
        </li>
        <li>your physical or electronic signature.</li>
      </ol>

      <h2>2. What happens next</h2>
      <ul>
        <li>
          We review each complete notice. Where it appears valid, we remove
          or disable access to the content promptly.
        </li>
        <li>
          We tell the instructor who published it and pass on the substance
          of the notice, including your contact details so they can respond.
        </li>
        <li>
          If a notice is incomplete, we will ask you for what is missing.
        </li>
      </ul>

      <h2>3. Counter-notices</h2>
      <p>
        If your content was removed and you believe that was a mistake or a
        misidentification, email {legalEmail} with:
      </p>
      <ol>
        <li>your name, postal address, phone number and email address;</li>
        <li>which content was removed and where it appeared;</li>
        <li>
          a statement that you believe in good faith the content was removed
          by mistake or misidentification, and that the information you give
          is accurate; and
        </li>
        <li>your physical or electronic signature.</li>
      </ol>
      <p>
        We send the counter-notice to the person who reported the content.
        Unless they tell us within 10 working days that they have started
        legal proceedings, we may restore the content.
      </p>

      <h2>4. Repeat infringers</h2>
      <p>
        We close the accounts of instructors who repeatedly infringe other
        people&apos;s intellectual property. See our{" "}
        <Link href="/creator-terms">Creator Terms</Link>.
      </p>

      <h2>5. False or abusive notices</h2>
      <p>
        Sending a notice or counter-notice you know to be false, or using
        this process to harm a competitor, may make you legally responsible
        for the damage it causes. We may ignore notices we believe are made
        in bad faith.
      </p>

      <h2>6. Other problems with content</h2>
      <p>
        For content that is misleading, harmful or otherwise breaks our{" "}
        <Link href="/content">Content Policy</Link> — but is not a copyright
        issue — contact{" "}
        <a href={`mailto:${COMPANY.supportEmail}`}>{COMPANY.supportEmail}</a>.
      </p>

      <h2>7. Where to send notices</h2>
      <p>
        {COMPANY.legalName}
        <br />
        {COMPANY.registeredAddress}
        <br />
        Email: {legalEmail}
      </p>
    </LegalPage>
  )
}
