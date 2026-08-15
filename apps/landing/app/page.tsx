import Link from "next/link";
import {
  Upload,
  Wallet,
  Rocket,
  ShieldCheck,
  Smartphone,
  ArrowRight,
  GraduationCap,
  BookOpen,
  Award,
} from "lucide-react";

const APP_URL = "https://app.paperglidr.com";

export default function Home() {
  return (
    <div className="flex flex-col bg-[#F5F3EE] dark:bg-[#0B0F1A]">
      {/* ---------- HERO ---------- */}
      <section className="relative overflow-hidden">
        <div className="mx-auto grid w-full max-w-7xl gap-16 px-6 py-20 sm:py-28 md:grid-cols-2 md:items-center lg:px-8">
          <div className="flex flex-col gap-6">
            <span className="font-mono text-xs font-medium uppercase tracking-[0.2em] text-[#C9A227]">
              For Course Creators in Nepal
            </span>
            <h1
              className="text-4xl font-medium leading-[1.1] tracking-tight text-[#14213D] dark:text-[#F5F3EE] sm:text-6xl"
              style={{ fontFamily: "'Fraunces', serif" }}
            >
              Upload once,
              <br />
              earn on repeat.
            </h1>
            <p className="max-w-md text-lg leading-8 text-[#14213D]/70 dark:text-[#F5F3EE]/70">
              PaperGlidr lets you publish a course in minutes, price it in
              rupees, and get paid directly through eSewa, Khalti, or Fonepay.
              No approval queue. No waiting on anyone.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                href={`${APP_URL}/sign-up`}
                className="inline-flex items-center justify-center gap-1 rounded-full bg-[#14213D] px-6 py-3 text-sm font-medium text-[#F5F3EE] transition-colors hover:bg-[#1d2e54] dark:bg-[#F5F3EE] dark:text-[#14213D] dark:hover:bg-white"
              >
                Start Selling Your Course <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="#how-it-works"
                className="inline-flex items-center justify-center rounded-full border border-[#14213D]/20 px-6 py-3 text-sm font-medium text-[#14213D] transition-colors hover:bg-[#14213D]/5 dark:border-[#F5F3EE]/20 dark:text-[#F5F3EE] dark:hover:bg-[#F5F3EE]/10"
              >
                See How It Works
              </Link>
            </div>
            <Link
              href={`${APP_URL}/browse`}
              className="inline-flex w-fit items-center gap-1.5 border-b border-dashed border-[#14213D]/30 pb-0.5 text-sm font-medium text-[#14213D]/60 transition-colors hover:border-[#14213D]/60 hover:text-[#14213D] dark:border-[#F5F3EE]/20 dark:text-[#F5F3EE]/50 dark:hover:text-[#F5F3EE]"
            >
              Looking to learn instead? Browse courses
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="relative h-80 w-full sm:h-100" aria-hidden="true">
            <svg
              viewBox="0 0 400 400"
              className="absolute inset-0 h-full w-full"
            >
              <path
                d="M 40 340 C 120 260, 160 180, 340 60"
                fill="none"
                stroke="#6FA8DC"
                strokeWidth="2"
                strokeDasharray="6 10"
                strokeLinecap="round"
                opacity="0.5"
              />
            </svg>
            <div className="plane-glide absolute">
              <svg width="72" height="72" viewBox="0 0 64 64" fill="none">
                <path
                  d="M4 34 L58 8 L34 58 L28 38 Z"
                  fill="#F5F3EE"
                  stroke="#14213D"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
                <path
                  d="M28 38 L34 58 L36 40 Z"
                  fill="#E8E4D9"
                  stroke="#14213D"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
                <path
                  d="M4 34 L36 30 L58 8"
                  fill="none"
                  stroke="#14213D"
                  strokeWidth="1.2"
                />
              </svg>
            </div>
          </div>
        </div>

        <div
          className="pointer-events-none absolute -bottom-1 left-0 h-24 w-[140%] -rotate-1 border-t border-[#C9A227]/40"
          aria-hidden="true"
        />
      </section>

      {/* ---------- CHOOSE YOUR PATH ---------- */}
      <section className="mx-auto w-full max-w-7xl px-6 pb-4 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-2">
          <Link
            href={`${APP_URL}/instructors/onboarding`}
            className="group relative overflow-hidden rounded-2xl bg-[#14213D] p-8 transition-transform hover:-translate-y-0.5 dark:bg-[#F5F3EE]/6"
          >
            <Rocket className="h-6 w-6 text-[#C9A227]" />
            <h3
              className="mt-4 text-xl font-medium text-[#F5F3EE] dark:text-[#F5F3EE]"
              style={{ fontFamily: "'Fraunces', serif" }}
            >
              I want to teach
            </h3>
            <p className="mt-1.5 text-sm text-[#F5F3EE]/60">
              Publish a course, price it in NPR, get paid directly.
            </p>
            <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-[#C9A227] transition-transform group-hover:translate-x-0.5">
              Start creating <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </Link>

          <Link
            href={`${APP_URL}/browse`}
            className="group relative overflow-hidden rounded-2xl bg-[#E8E4D9] p-8 transition-transform hover:-translate-y-0.5 dark:bg-white/4"
          >
            <GraduationCap className="h-6 w-6 text-[#6FA8DC]" />
            <h3
              className="mt-4 text-xl font-medium text-[#14213D] dark:text-[#F5F3EE]"
              style={{ fontFamily: "'Fraunces', serif" }}
            >
              I want to learn
            </h3>
            <p className="mt-1.5 text-sm text-[#14213D]/60 dark:text-[#F5F3EE]/60">
              Courses from Nepali instructors, paid for in NPR.
            </p>
            <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-[#14213D] transition-transform group-hover:translate-x-0.5 dark:text-[#F5F3EE]">
              Browse courses <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </Link>
        </div>
      </section>

      {/* ---------- WHY CREATORS CHOOSE THIS ---------- */}
      <section className="mx-auto w-full max-w-7xl px-6 py-20 sm:py-28 lg:px-8">
        <h2
          className="max-w-xl text-3xl font-medium text-[#14213D] dark:text-[#F5F3EE] sm:text-4xl"
          style={{ fontFamily: "'Fraunces', serif" }}
        >
          Built for the way you actually get paid.
        </h2>
        <div className="mt-14 grid gap-8 sm:grid-cols-3">
          {[
            {
              icon: Rocket,
              title: "No gatekeeping",
              body: "Sign up and publish immediately. There's no application, no waitlist, no reviewer deciding if your course is good enough.",
            },
            {
              icon: Wallet,
              title: "Paid in rupees, directly",
              body: "Price your course in NPR. Payouts land through eSewa, Khalti, or Fonepay — the wallets your students already use.",
            },
            {
              icon: Smartphone,
              title: "Built for how Nepal buys",
              body: "Students check out with QR and mobile wallets, not a foreign card form that fails at checkout.",
            },
          ].map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="rounded-2xl bg-[#E8E4D9] p-8 dark:bg-white/4"
            >
              <Icon className="h-6 w-6 text-[#6FA8DC]" />
              <h3 className="mt-4 text-lg font-medium text-[#14213D] dark:text-[#F5F3EE]">
                {title}
              </h3>
              <p className="mt-2 text-[#14213D]/70 dark:text-[#F5F3EE]/70">
                {body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- HOW IT WORKS ---------- */}
      <section
        id="how-it-works"
        className="mx-auto w-full max-w-7xl px-6 py-20 sm:py-28 lg:px-8"
      >
        <h2
          className="text-3xl font-medium text-[#14213D] dark:text-[#F5F3EE] sm:text-4xl"
          style={{ fontFamily: "'Fraunces', serif" }}
        >
          Three steps to your first sale
        </h2>
        <div className="mt-14 grid gap-10 sm:grid-cols-3">
          {[
            {
              n: "01",
              icon: Upload,
              title: "Upload your course",
              body: "Add your videos, structure your lessons, write a description. No format to fight, no reviewer in the loop.",
            },
            {
              n: "02",
              icon: Wallet,
              title: "Set your price in NPR",
              body: "Decide what your knowledge is worth. Change it any time, run a discount when you want to.",
            },
            {
              n: "03",
              icon: ShieldCheck,
              title: "Get paid automatically",
              body: "Every purchase pays out to your eSewa, Khalti, or Fonepay account — no invoices to chase.",
            },
          ].map(({ n, icon: Icon, title, body }) => (
            <div key={n}>
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm text-[#C9A227]">{n}</span>
                <Icon className="h-5 w-5 text-[#6FA8DC]" />
              </div>
              <h3 className="mt-3 text-xl font-medium text-[#14213D] dark:text-[#F5F3EE]">
                {title}
              </h3>
              <p className="mt-2 text-[#14213D]/70 dark:text-[#F5F3EE]/70">
                {body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- PAYMENT METHODS ---------- */}
      <section className="mx-auto w-full max-w-7xl px-6 pb-20 sm:pb-28 lg:px-8">
        <div className="rounded-2xl bg-[#14213D] p-8 dark:bg-[#F5F3EE]/4 sm:p-12">
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-[#C9A227]">
            Get Paid How Your Students Pay
          </span>
          <h2
            className="mt-3 max-w-lg text-2xl font-medium text-[#F5F3EE] sm:text-3xl"
            style={{ fontFamily: "'Fraunces', serif" }}
          >
            Every payout lands in the wallet you already use.
          </h2>
          <div className="mt-8 flex flex-wrap gap-3">
            {["eSewa", "Khalti", "Fonepay"].map((name) => (
              <span
                key={name}
                className="rounded-full border border-[#F5F3EE]/20 px-4 py-2 text-sm font-medium text-[#F5F3EE]"
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- FROM THE BLOG ---------- */}
      <section className="mx-auto w-full max-w-7xl px-6 pb-20 sm:pb-28 lg:px-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <span className="font-mono text-xs font-medium uppercase tracking-[0.2em] text-[#C9A227]">
              Resources
            </span>
            <h2
              className="mt-3 text-2xl font-medium text-[#14213D] dark:text-[#F5F3EE] sm:text-3xl"
              style={{ fontFamily: "'Fraunces', serif" }}
            >
              Guides for Nepali course creators
            </h2>
          </div>
          <Link
            href="/blog"
            className="hidden shrink-0 items-center gap-1 text-sm font-medium text-[#14213D]/70 hover:text-[#14213D] sm:inline-flex dark:text-[#F5F3EE]/60 dark:hover:text-[#F5F3EE]"
          >
            Visit the blog <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {[
            {
              icon: Wallet,
              title: "Pricing your first course in NPR",
            },
            {
              icon: GraduationCap,
              title: "What makes a Lok Sewa prep course sell",
            },
            {
              icon: Award,
              title: "Building trust with certificates and reviews",
            },
          ].map(({ icon: Icon, title }) => (
            <div
              key={title}
              className="flex flex-col gap-4 rounded-2xl border border-[#14213D]/10 p-6 dark:border-[#F5F3EE]/10"
            >
              <Icon className="h-5 w-5 text-[#6FA8DC]" />
              <h3 className="text-base font-medium leading-snug text-[#14213D] dark:text-[#F5F3EE]">
                {title}
              </h3>
              <span className="mt-auto text-xs font-medium uppercase tracking-wide text-[#14213D]/40 dark:text-[#F5F3EE]/40">
                Coming soon
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- CTA BANNER ---------- */}
      <section className="bg-[#14213D] py-20 dark:bg-[#0B0F1A] sm:py-24">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-center gap-6 px-6 text-center lg:px-8">
          <h2
            className="text-3xl font-medium text-[#F5F3EE] sm:text-4xl"
            style={{ fontFamily: "'Fraunces', serif" }}
          >
            Your course is worth publishing today.
          </h2>
          <p className="max-w-md text-[#F5F3EE]/70">
            Set up your creator page and publish your first lesson before the
            day is over.
          </p>
          <Link
            href={`${APP_URL}/sign-up`}
            className="inline-flex items-center justify-center rounded-full bg-[#C9A227] px-8 py-3 text-sm font-medium text-[#14213D] transition-colors hover:bg-[#dab236]"
          >
            Start Creating — It's Free
          </Link>
        </div>
      </section>

      <style>{`
        .plane-glide {
          top: 260px;
          left: 20px;
          animation: glide 6s ease-in-out infinite;
        }
        @keyframes glide {
          0% { transform: translate(0, 0) rotate(-4deg); }
          50% { transform: translate(280px, -260px) rotate(8deg); }
          100% { transform: translate(0, 0) rotate(-4deg); }
        }
        @media (prefers-reduced-motion: reduce) {
          .plane-glide { animation: none; }
        }
      `}</style>
    </div>
  );
}
