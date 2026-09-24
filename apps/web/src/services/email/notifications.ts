import "server-only"
import { env } from "@/data/env/server"
import { sendEmail } from "./resend"

/** Escape text for an HTML email body (names, titles, reasons are user text). */
export function escapeHtml(text: string) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
}

/**
 * A plain notification email: each paragraph is escaped text, plus an
 * optional link. Best effort — a failed send is logged and never fails the
 * action that triggered it (the state change has already committed).
 */
export async function sendNotification({
  to,
  subject,
  paragraphs,
  link,
}: {
  to: string
  subject: string
  paragraphs: string[]
  link?: { href: string; label: string }
}) {
  const html = [
    ...paragraphs.map(p => `<p>${escapeHtml(p)}</p>`),
    link ? `<p><a href="${escapeHtml(link.href)}">${escapeHtml(link.label)}</a></p>` : "",
  ].join("\n")
  try {
    await sendEmail({ from: env.NOTIFICATIONS_FROM_EMAIL, to, subject, html })
    return true
  } catch (error) {
    console.error(`[notification] "${subject}" to user failed`, error)
    return false
  }
}
