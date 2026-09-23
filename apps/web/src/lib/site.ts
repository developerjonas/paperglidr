import type { Metadata } from "next"
import { env as clientEnv } from "@/data/env/client"

export const SITE_NAME = "PaperGlidr"

/**
 * Canonical origin for metadata, Open Graph URLs, the sitemap and robots —
 * https://paperglidr.com in production (NEXT_PUBLIC_APP_URL, validated).
 * The fallback only applies when env validation is skipped (CI builds).
 */
export const SITE_URL = (clientEnv.NEXT_PUBLIC_APP_URL ?? "https://paperglidr.com").replace(/\/+$/, "")

export const SITE_DESCRIPTION =
  "Online courses from Nepali instructors, priced in NPR and paid with eSewa, Khalti or Fonepay. Creators publish in minutes and earn in rupees."

/** Title, description, canonical URL and Open Graph for a simple page. */
export function pageMetadata({
  title,
  description,
  path,
}: {
  title: string
  description: string
  path: string
}): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { title, description, url: path, type: "website", siteName: SITE_NAME },
    twitter: { card: "summary", title, description },
  }
}
