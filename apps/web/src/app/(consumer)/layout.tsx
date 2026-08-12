import { ReactNode } from "react"
import { Navbar } from "@/components/Navbar"
import { Footer } from "@/components/Footer"

export default function ConsumerLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <>
      <Navbar />
      <main>{children}</main>
      <Footer />
    </>
  )
}
