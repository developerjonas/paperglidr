import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getCurrentUser } from "@/services/auth"
import { getAccountDeletionBlocker } from "@/features/users/lib/deleteAccount"
import { DeleteAccountForm } from "@/features/users/components/DeleteAccountForm"
import { COMPANY } from "@/config/company"
import { SITE_NAME, pageMetadata } from "@/lib/site"

// The "delete my account" page. Its URL is also the deletion link the
// app stores ask for; signed-out visitors are sent to sign in and back
// here (middleware.ts protects /account).
export const metadata: Metadata = {
  ...pageMetadata({
    title: "Delete your account",
    description: `Permanently delete your ${SITE_NAME} account.`,
    path: "/account/delete",
  }),
  robots: { index: false },
}

export default async function DeleteAccountPage() {
  const { userId, redirectToSignIn } = await getCurrentUser()
  if (userId == null) return redirectToSignIn()
  const blocker = await getAccountDeletionBlocker(userId)

  return (
    <div className="flex min-h-screen flex-col">
      <section className="section-muted border-b py-14 md:py-20">
        <div className="container mx-auto max-w-2xl px-4">
          <Link
            href="/account"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Account
          </Link>
          <h1 className="heading-display mt-4 text-3xl sm:text-4xl">Delete your account</h1>
          <p className="mt-2 text-muted-foreground">
            This permanently closes your {SITE_NAME} account. It can&apos;t be undone.
          </p>
        </div>
      </section>

      <section className="container mx-auto max-w-2xl px-4 py-10">
        <Card className="border-border bg-card shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">What happens</CardTitle>
            <CardDescription>As described in our Privacy Policy.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-5 text-sm sm:grid-cols-2">
            <div>
              <p className="font-medium">Deleted now</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
                <li>Your name, email, username and photo</li>
                <li>Your password and Google/GitHub sign-in</li>
                <li>Access to your courses, and your progress</li>
                <li>Your wishlist</li>
                <li>You&apos;re signed out on every device, including the app</li>
              </ul>
            </div>
            <div>
              <p className="font-medium">Kept</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
                <li>Purchase, invoice and refund records, as Nepal&apos;s tax law requires</li>
                <li>Your reviews and questions, shown as &ldquo;Deleted user&rdquo;</li>
                <li>Certificates already issued, so ones you shared still verify</li>
              </ul>
            </div>
            <p className="text-muted-foreground sm:col-span-2">
              Courses you bought can&apos;t be moved to another account or refunded by deleting it. If
              you want a refund, ask for it first from{" "}
              <Link href="/purchases" className="text-primary hover:underline">
                My Purchases
              </Link>
              .
            </p>
          </CardContent>
        </Card>

        <Card className="mt-6 border-destructive/20 bg-destructive/5 shadow-sm dark:bg-destructive/10">
          <CardHeader>
            <CardTitle className="text-lg">Delete my account</CardTitle>
          </CardHeader>
          <CardContent>
            {blocker ? (
              <p className="text-sm">{blocker.message}</p>
            ) : (
              <DeleteAccountForm />
            )}
          </CardContent>
        </Card>

        <p className="mt-6 text-sm text-muted-foreground">
          Can&apos;t sign in? Email{" "}
          <a href={`mailto:${COMPANY.legalEmail}`} className="text-primary hover:underline">
            {COMPANY.legalEmail}
          </a>{" "}
          from the address on your account and we&apos;ll delete it for you.
        </p>
      </section>
    </div>
  )
}
