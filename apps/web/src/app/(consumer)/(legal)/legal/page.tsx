import type { Metadata } from "next"
import Link from "next/link"
import { LegalPage } from "@/components/LegalPage"
import { COMPANY, LEGAL_LAST_UPDATED } from "@/config/company"
import { pageMetadata } from "@/lib/site"
import { LEGAL_PAGES } from "@/config/legalPages"

export const metadata: Metadata = pageMetadata({
  title: "Legal",
  description: "All of Chiyali's terms and policies in one place.",
  path: "/legal",
})

export default function LegalIndexPage() {
  return (
    <LegalPage title="Legal" lastUpdated={LEGAL_LAST_UPDATED}>
      <p>
        The terms and policies that apply when you use {COMPANY.brandName}.
        Questions about any of them:{" "}
        <a href={`mailto:${COMPANY.legalEmail}`}>{COMPANY.legalEmail}</a> or our{" "}
        <Link href="/contact">contact page</Link>.
      </p>
      <ul>
        {LEGAL_PAGES.map(page => (
          <li key={page.href}>
            <Link href={page.href}>{page.title}</Link> — {page.summary}
          </li>
        ))}
      </ul>
    </LegalPage>
  )
}
