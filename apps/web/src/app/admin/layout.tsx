import { ReactNode } from "react"
import { Navbar } from "@/components/Navbar"

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
