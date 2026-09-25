"use client"
import { use } from "react"
import Link from "next/link"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { SignUpForm } from "@/components/auth/SignUpForm"
import { OrDivider, SocialSignInButtons } from "@/components/auth/SocialSignInButtons"
import { safeRedirectPath } from "@/lib/safeRedirect"

export default function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ redirectTo?: string | string[] }>
}) {
  // Only a path on this site; anything else falls back to "/".
  const redirectTo = safeRedirectPath(use(searchParams).redirectTo)

  return (
    <div className="flex min-h-[calc(100vh-4rem)] w-full items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-semibold tracking-tight">Create an account</CardTitle>
          <CardDescription>Get started with Chiyali in a few seconds</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5">
          <SocialSignInButtons callbackURL={redirectTo} verb="Continue" />
          <OrDivider label="or sign up with email" />
          <SignUpForm redirectTo={redirectTo} />
        </CardContent>
        <CardFooter className="flex flex-col gap-2 text-center text-sm text-muted-foreground">
          <div>
            Already have an account?{" "}
            <Link
              href={redirectTo === "/" ? "/sign-in" : `/sign-in?redirectTo=${encodeURIComponent(redirectTo)}`}
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Sign in
            </Link>
          </div>
          <p className="px-4 text-xs text-muted-foreground/80">
            By creating an account, you agree to our{" "}
            <Link href="/tos" className="underline underline-offset-2">Terms of Service</Link> and{" "}
            <Link href="/privacy" className="underline underline-offset-2">Privacy Policy</Link>.
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
