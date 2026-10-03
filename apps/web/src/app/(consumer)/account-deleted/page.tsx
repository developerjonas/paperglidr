import type { Metadata } from "next"
import Link from "next/link"
import { CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SITE_NAME } from "@/lib/site"

// Where /account/delete lands. Public on purpose: the account is gone.
export const metadata: Metadata = {
  title: "Account deleted",
  robots: { index: false },
}

export default function AccountDeletedPage() {
  return (
    <section className="container mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 py-16 text-center">
      <CheckCircle2 className="h-12 w-12 fill-success text-background" />
      <h1 className="heading-display mt-6 text-3xl sm:text-4xl">Your account has been deleted</h1>
      <p className="mt-3 text-muted-foreground">
        You&apos;ve been signed out on every device, including the {SITE_NAME} app. Thank you for
        learning with us. You&apos;re welcome back any time with a new account.
      </p>
      <Button asChild className="mt-8">
        <Link href="/">Go to the home page</Link>
      </Button>
    </section>
  )
}
