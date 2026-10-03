import { ReactNode } from "react"
import { Navbar } from "@/components/Navbar"
import { requireAdmin } from "@/services/auth"
import { AdminSidebar } from "@/features/admin/components/AdminSidebar"
import { getAttentionCounts } from "@/features/admin/db/attention"

// Admin pages show live data (revenue, payouts, tickets) and must never be
// prerendered at build time — that baked stale data into static HTML and
// made `next build` require a live database.
export const dynamic = "force-dynamic"

export default async function AdminLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  await requireAdmin()
  const counts = await getAttentionCounts()
  return (
    <>
      <Navbar isAdminPage />
      <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-4 px-4 py-6 sm:px-6 lg:flex-row lg:gap-8 lg:px-8">
        <AdminSidebar counts={counts} />
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </>
  )
}
