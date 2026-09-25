import Link from "next/link"
import type { Metadata } from "next"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm"

export const metadata: Metadata = { title: "Choose a new password", robots: { index: false } }

// The emailed link goes through Better Auth (/api/auth/reset-password/:token),
// which lands here with ?token=… when it's valid or ?error=INVALID_TOKEN.
export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string | string[]; error?: string | string[] }>
}) {
  const { token, error } = await searchParams
  const validToken = typeof token === "string" && token.length > 0 && error == null ? token : null

  return (
    <div className="flex min-h-[calc(100vh-4rem)] w-full items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-semibold tracking-tight">
            {validToken ? "Choose a new password" : "This link doesn't work"}
          </CardTitle>
          <CardDescription>
            {validToken
              ? "Pick a strong one and save it in your password manager."
              : "Reset links work once and expire after 1 hour."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {validToken ? (
            <ResetPasswordForm token={validToken} />
          ) : (
            <Button asChild size="lg" className="w-full">
              <Link href="/forgot-password">Send a new link</Link>
            </Button>
          )}
        </CardContent>
        <CardFooter className="justify-center text-sm text-muted-foreground">
          <Link href="/sign-in" className="font-medium text-primary underline-offset-4 hover:underline">
            Back to sign in
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}
