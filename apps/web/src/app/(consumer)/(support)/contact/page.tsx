import type { Metadata } from "next"
import Link from "next/link"
import { LegalPage } from "@/components/LegalPage"
import {
  COMPANY,
  companyPanDisplay,
  companyRegistrationDisplay,
} from "@/config/company"
import { pageMetadata } from "@/lib/site"

export const metadata: Metadata = pageMetadata({
  title: "Contact",
  description: "How to reach Chiyali: support tickets, support and legal email, and our registered office.",
  path: "/contact",
})

export default function ContactPage() {
  return (
    <LegalPage title="Contact us">
      <h2>Help with your account, a course or a payment</h2>
      <p>
        The fastest way to reach us is a support ticket — it keeps your whole
        conversation with our team in one place.
      </p>
      <ul>
        <li>
          <Link href="/support/new">Open a support ticket</Link> (you&apos;ll be
          asked to sign in)
        </li>
        <li>
          <Link href="/support">See your existing tickets</Link>
        </li>
        <li>
          Or email{" "}
          <a href={`mailto:${COMPANY.supportEmail}`}>{COMPANY.supportEmail}</a>
        </li>
      </ul>
      <p>
        Paid but can&apos;t see your course? Include your purchase reference from
        your <Link href="/purchases">purchase history</Link>. Looking for a
        refund? See the <Link href="/refund-policy">Refund Policy</Link>.
      </p>

      <h2>Legal, privacy and copyright</h2>
      <ul>
        <li>
          Copyright and takedown notices, privacy requests and other legal
          matters:{" "}
          <a href={`mailto:${COMPANY.legalEmail}`}>{COMPANY.legalEmail}</a>
        </li>
        <li>
          How to send a copyright notice:{" "}
          <Link href="/dmca">DMCA &amp; Takedown Policy</Link>
        </li>
        <li>
          All our policies: <Link href="/legal">Legal</Link>
        </li>
      </ul>

      <h2>Company</h2>
      <table>
        <tbody>
          <tr>
            <th>Legal name</th>
            <td>{COMPANY.legalName}</td>
          </tr>
          <tr>
            <th>Registered office</th>
            <td>{COMPANY.registeredAddress}</td>
          </tr>
          <tr>
            <th>Company registration</th>
            <td>{companyRegistrationDisplay}</td>
          </tr>
          <tr>
            <th>PAN</th>
            <td>{companyPanDisplay}</td>
          </tr>
        </tbody>
      </table>
    </LegalPage>
  )
}
