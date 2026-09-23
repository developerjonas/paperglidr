import { ReactNode } from "react"
import { Navbar } from "@/components/Navbar"

// Admin pages show live data (revenue, payouts, tickets) and must never be
// prerendered at build time — that baked stale data into static HTML and
// made `next build` require a live database.
export const dynamic = "force-dynamic"

export default function AdminLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <>
      <Navbar isAdminPage />
      <main className="container my-6">{children}</main>
    </>
  )
}
