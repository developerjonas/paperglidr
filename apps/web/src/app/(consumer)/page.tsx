import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  Award,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  CreditCard,
} from "lucide-react";

export default async function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* ---------------- 1. HERO SECTION ---------------- */}
      <section className="relative overflow-hidden border-b border-white/10 bg-gradient-to-b from-primary/5 via-background to-background py-16 md:py-24">
        {/* Decorative Background Blur */}
        <div className="absolute top-1/4 left-1/2 -z-10 h-[300px] w-[500px] -translate-x-1/2 rounded-full bg-primary/10 blur-[120px]" />

        <div className="container mx-auto px-4 text-center">
          <Badge
            variant="secondary"
            className="mb-4 inline-flex items-center gap-1.5 border border-primary/20 bg-primary/10 px-3 py-1 text-xs text-primary backdrop-blur-md"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Nepal&apos;s Next-Gen Learning Platform
          </Badge>

          <h1 className="mx-auto max-w-4xl text-3xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">
            Master High-Demand Skills & Advance Your Career
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground text-base sm:text-lg">
            Learn software development, Lok Sewa prep, design, and academic
            subjects from expert Nepali instructors with verified certificates.
          </p>

          {/* Quick CTA Buttons */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Button
              size="lg"
              asChild
              className="rounded-full font-semibold shadow-lg"
            >
              <Link href="/browse">
                Explore Courses <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="rounded-full border-white/20 bg-white/40 backdrop-blur-md dark:bg-black/40"
            >
              <Link href="/teach">Teach on Paperglidr</Link>
            </Button>
          </div>

          {/* Stats Bar */}
          <div className="mt-12 grid grid-cols-2 gap-4 border-t border-white/10 pt-8 md:grid-cols-4">
            <div className="flex flex-col items-center">
              <span className="text-2xl font-bold text-foreground sm:text-3xl">
                100%
              </span>
              <span className="text-xs text-muted-foreground">
                Local Payment Options
              </span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-2xl font-bold text-foreground sm:text-3xl">
                HD
              </span>
              <span className="text-xs text-muted-foreground">
                Self-Paced Videos
              </span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-2xl font-bold text-foreground sm:text-3xl">
                Verified
              </span>
              <span className="text-xs text-muted-foreground">
                Course Certificates
              </span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-2xl font-bold text-foreground sm:text-3xl">
                NPR
              </span>
              <span className="text-xs text-muted-foreground">
                Affordable Pricing
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- 4. INSTRUCTOR / CREATOR CTA ---------------- */}
      <section className="container mx-auto px-4 py-12">
        <div className="relative overflow-hidden rounded-3xl border border-white/20 bg-gradient-to-r from-primary/10 via-primary/5 to-background p-8 md:p-12 shadow-xl backdrop-blur-xl">
          <div className="grid gap-8 md:grid-cols-2 md:items-center">
            <div className="space-y-4">
              <Badge
                variant="secondary"
                className="bg-amber-500/10 text-amber-600 border-amber-500/20"
              >
                Become an Instructor
              </Badge>
              <h2 className="text-2xl font-bold tracking-tight sm:text-4xl">
                Share your expertise with thousands of Nepali students
              </h2>
              <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                Teach what you love. Paperglidr provides you with the tools,
                video hosting, and direct payout support to build a successful
                online teaching business in Nepal.
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" /> Keep up to
                  80% of course revenue
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" /> Built-in
                  video DRM & protected content
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" /> Easy local
                  bank & wallet payouts
                </li>
              </ul>
              <Button size="lg" asChild className="mt-2">
                <Link href="/teach">Start Teaching Today</Link>
              </Button>
            </div>

            <div className="hidden md:flex justify-center">
              <div className="relative w-full max-w-md rounded-2xl border border-white/20 bg-white/40 p-6 shadow-2xl backdrop-blur-2xl dark:bg-black/40">
                <div className="flex items-center gap-4 mb-4">
                  <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary">
                    PG
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">Instructor Studio</h4>
                    <p className="text-xs text-muted-foreground">
                      Publish & Earn in NPR
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="h-3 w-full rounded bg-muted/60" />
                  <div className="h-3 w-4/5 rounded bg-muted/40" />
                  <div className="h-3 w-2/3 rounded bg-muted/30" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- 5. WHY CHOOSE PAPERGLIDR ---------------- */}
      <section className="border-t border-white/10 bg-muted/20 py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Why Students Choose Paperglidr
            </h2>
            <p className="text-muted-foreground text-sm mt-2">
              Designed specifically for learners and creators across Nepal.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="rounded-2xl border border-white/10 bg-white/40 p-6 backdrop-blur-md dark:bg-black/30">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-lg">Quality Content</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Courses created by industry experts and experienced educators in
                Nepal.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/40 p-6 backdrop-blur-md dark:bg-black/30">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                <CreditCard className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-lg">Localized & Affordable</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Priced in Nepalese Rupees (NPR) with seamless local payment
                support.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/40 p-6 backdrop-blur-md dark:bg-black/30">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                <Award className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-lg">Verified Certification</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Earn shareable certificates upon completion to boost your
                resume.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
