"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
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
import { LogOut } from "lucide-react"

// Better Auth stores each sign-in method as an "account" with a providerId
// (e.g. "google", "github", or "credential" for email/password).
// This maps that raw id to something friendly to show the user.
const PROVIDER_META: Record<string, { label: string; icon: React.FC<React.SVGProps<SVGSVGElement>> }> = {
  google: { label: "Google", icon: GoogleIcon },
  github: { label: "GitHub", icon: GitHubIcon },
  credential: { label: "Email & Password", icon: MailIcon },
}

export default function AccountPage() {
  const router = useRouter()
  const { data: session, isPending } = authClient.useSession()
  const [providers, setProviders] = useState<string[] | null>(null)

  // Redirect guests straight to sign-in — this page requires a session
  useEffect(() => {
    if (!isPending && !session) {
      router.replace("/sign-in")
    }
  }, [isPending, session, router])

  // Fetch which provider(s) this account is linked with
  useEffect(() => {
    if (!session) return
    authClient
      .listAccounts()
      .then((res) => {
        const ids = res.data?.map((a) => a.providerId) ?? []
        setProviders(ids.length ? ids : ["credential"])
      })
      .catch(() => setProviders(["credential"]))
  }, [session])

  const handleLogout = async () => {
    await authClient.signOut()
    router.push("/")
    router.refresh()
  }

  if (isPending || !session) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
        <div className="h-64 w-full max-w-md animate-pulse rounded-2xl border border-white/30 bg-white/40 backdrop-blur-md dark:border-white/10 dark:bg-white/5" />
      </div>
    )
  }

  const user = session.user
  const initial = (user.name || user.email || "?").charAt(0).toUpperCase()

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
      <Card className="w-full max-w-md border-white/30 bg-white/60 shadow-lg backdrop-blur-2xl backdrop-saturate-150 dark:border-white/10 dark:bg-black/40">
        <CardHeader className="items-center space-y-3 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-b from-primary to-primary/80 text-xl font-bold text-primary-foreground shadow-[inset_0_1px_0_0_rgba(255,255,255,0.3)]">
            {initial}
          </div>
          <div className="space-y-1">
            <CardTitle className="text-2xl font-bold tracking-tight">
              {user.name || "Your account"}
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              {user.email}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="grid gap-3">
          <div className="rounded-2xl border border-white/30 bg-white/40 p-4 backdrop-blur-md dark:border-white/10 dark:bg-white/[0.03]">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Signed in with
            </p>
            <div className="flex flex-wrap gap-2">
              {(providers ?? []).map((id) => {
                const meta = PROVIDER_META[id] ?? { label: id, icon: MailIcon }
                const Icon = meta.icon
                return (
                  <span
                    key={id}
                    className="flex items-center gap-1.5 rounded-full border border-white/30 bg-white/60 px-3 py-1.5 text-sm font-medium dark:border-white/10 dark:bg-white/5"
                  >
                    <Icon className="h-4 w-4" />
                    {meta.label}
                  </span>
                )
              })}
              {providers === null && (
                <span className="text-sm text-muted-foreground">Loading…</span>
              )}
            </div>
          </div>
        </CardContent>

        <CardFooter>
          <Button
            type="button"
            variant="destructiveOutline"
            size="lg"
            onClick={handleLogout}
            className="w-full gap-2"
          >
            <LogOut className="h-4 w-4" />
            Log out
          </Button>
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
        fill="currentColor"
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

function MailIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="m4 7 8 6 8-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
