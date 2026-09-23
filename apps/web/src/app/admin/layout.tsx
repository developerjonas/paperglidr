import { ReactNode } from "react"
import { Navbar } from "@/components/Navbar"
import { requireAdmin } from "@/services/auth"

// Admin pages show live data (revenue, payouts, tickets) and must never be
// prerendered at build time — that baked stale data into static HTML and
// made `next build` require a live database.
export const dynamic = "force-dynamic"

export default async function AdminLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  await requireAdmin()
  return (
    <>
      <Navbar isAdminPage />
      <main className="container my-6">{children}</main>
    </>
  )
}
