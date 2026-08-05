"use client"
import Link from "next/link"
import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
export default function SignInPage() {
  const handleGitHubSignIn = async () => {
    await authClient.signIn.social({
      provider: "github",
      callbackURL: "/", // Where to direct the user after login
    })
  }
  const handleGoogleSignIn = async () => {
    await authClient.signIn.social({
      provider: "google",
      callbackURL: "/", // Where to direct the user after login
    })
  }
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg border-border/50">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold tracking-tight">
            Welcome back
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Sign in to your paperglidr account to continue
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {/* Google OAuth Button wired to Better Auth */}
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center gap-2 border-border hover:bg-accent font-medium py-5"
          >
            <GoogleIcon className="h-5 w-5" />
            Sign in with Google
          </Button>
          {/* GitHub OAuth Button wired to Better Auth */}
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={handleGitHubSignIn}
            className="w-full flex items-center justify-center gap-2 border-border hover:bg-accent font-medium py-5"
          >
            <GitHubIcon className="h-5 w-5 fill-current" />
            Sign in with GitHub
          </Button>
          {/* Optional Divider for visual balance */}
          <div className="relative my-2">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border/60" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                Fast & Secure Single Sign-On
              </span>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-2 text-center text-sm text-muted-foreground">
          <div>
            Don&apos;t have an account?{" "}
            <Link
              href="/sign-up"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Sign up
            </Link>
          </div>
          <p className="text-xs text-muted-foreground/70 px-4">
            By signing in, you agree to our Terms of Service and Privacy Policy.
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
function GitHubIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
      />
    </svg>
  )
}
function GoogleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path
        fill="#4285F4"
        d="M23.52 12.273c0-.851-.076-1.67-.218-2.455H12v4.645h6.458c-.278 1.5-1.124 2.771-2.396 3.622v3.01h3.878c2.269-2.09 3.58-5.166 3.58-8.822z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.956-1.075 7.94-2.905l-3.878-3.01c-1.075.72-2.45 1.146-4.062 1.146-3.124 0-5.768-2.11-6.712-4.945H1.28v3.107C3.253 21.31 7.31 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.288 14.286A7.21 7.21 0 014.91 12c0-.793.137-1.564.378-2.286V6.607H1.28A11.996 11.996 0 000 12c0 1.936.464 3.769 1.28 5.393l4.008-3.107z"
      />
      <path
        fill="#EA4335"
        d="M12 4.77c1.762 0 3.344.606 4.59 1.796l3.443-3.443C17.951 1.19 15.235 0 12 0 7.31 0 3.253 2.69 1.28 6.607l4.008 3.107C6.232 6.879 8.876 4.77 12 4.77z"
      />
    </svg>
  )
}
