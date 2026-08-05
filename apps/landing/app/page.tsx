import Link from "next/link"
import {
  Code2,
  Palette,
  Calculator,
  Languages,
  Briefcase,
  Music,
  ArrowRight,
} from "lucide-react"

export default function Home() {
  return (
    <div className="flex flex-col bg-[#F5F3EE] dark:bg-[#0B0F1A]">
      {/* ---------- HERO ---------- */}
      <section className="relative overflow-hidden">
        <div className="container grid gap-16 py-20 sm:py-28 md:grid-cols-2 md:items-center">
          <div className="flex flex-col gap-6">
            <span className="font-mono text-xs font-medium uppercase tracking-[0.2em] text-[#C9A227]">
              PaperGlidr · Courses &amp; Tutors
            </span>
            <h1
              className="text-4xl font-medium leading-[1.1] tracking-tight text-[#14213D] dark:text-[#F5F3EE] sm:text-6xl"
              style={{ fontFamily: "'Fraunces', serif" }}
            >
              Learning that glides,
              <br />
              not grinds.
            </h1>
            <p className="max-w-md text-lg leading-8 text-[#14213D]/70 dark:text-[#F5F3EE]/70">
              PaperGlidr pairs you with tutors and courses that get you from
              confused to confident — one smooth flight path at a time.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                href="/courses"
                className="inline-flex items-center justify-center gap-1 rounded-full bg-[#14213D] px-6 py-3 text-sm font-medium text-[#F5F3EE] transition-colors hover:bg-[#1d2e54] dark:bg-[#F5F3EE] dark:text-[#14213D] dark:hover:bg-white"
              >
                Browse Courses <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/teach"
                className="inline-flex items-center justify-center rounded-full border border-[#14213D]/20 px-6 py-3 text-sm font-medium text-[#14213D] transition-colors hover:bg-[#14213D]/5 dark:border-[#F5F3EE]/20 dark:text-[#F5F3EE] dark:hover:bg-[#F5F3EE]/10"
              >
                Become a Tutor
              </Link>
            </div>
          </div>

          <div className="relative h-[320px] w-full sm:h-[400px]" aria-hidden="true">
            <svg viewBox="0 0 400 400" className="absolute inset-0 h-full w-full">
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

      {/* ---------- TWO RUNWAYS ---------- */}
      <section className="container grid gap-6 py-20 sm:py-28 md:grid-cols-2">
        <div className="rounded-2xl bg-[#E8E4D9] p-8 dark:bg-white/[.04] sm:p-10">
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-[#6FA8DC]">
            Runway 01
          </span>
          <h2
            className="mt-3 text-2xl font-medium text-[#14213D] dark:text-[#F5F3EE] sm:text-3xl"
            style={{ fontFamily: "'Fraunces', serif" }}
          >
            Find your course, book a tutor, take off.
          </h2>
          <ul className="mt-6 space-y-3 text-[#14213D]/70 dark:text-[#F5F3EE]/70">
            <li>Curated courses across dozens of subjects</li>
            <li>1:1 sessions with tutors who actually respond</li>
            <li>Track your progress, one lesson at a time</li>
          </ul>
          <Link
            href="/courses"
            className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-[#14213D] underline underline-offset-4 hover:no-underline dark:text-[#F5F3EE]"
          >
            Explore courses <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="rounded-2xl bg-[#14213D] p-8 dark:bg-[#F5F3EE]/[.04] sm:p-10">
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-[#C9A227]">
            Runway 02
          </span>
          <h2
            className="mt-3 text-2xl font-medium text-[#F5F3EE] sm:text-3xl"
            style={{ fontFamily: "'Fraunces', serif" }}
          >
            Turn your knowledge into a runway for others.
          </h2>
          <ul className="mt-6 space-y-3 text-[#F5F3EE]/70">
            <li>Set your own schedule and rates</li>
            <li>Get paid per session, no chasing invoices</li>
            <li>Build a following around what you teach</li>
          </ul>
          <Link
            href="/teach"
            className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-[#F5F3EE] underline underline-offset-4 hover:no-underline"
          >
            Start teaching <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* ---------- HOW IT WORKS ---------- */}
      <section className="container py-20 sm:py-28">
        <h2
          className="text-center text-3xl font-medium text-[#14213D] dark:text-[#F5F3EE] sm:text-4xl"
          style={{ fontFamily: "'Fraunces', serif" }}
        >
          How it works
        </h2>
        <div className="mt-14 grid gap-10 sm:grid-cols-3">
          {[
            {
              n: "01",
              title: "Chart your course",
              body: "Browse subjects and pick what you actually want to learn.",
            },
            {
              n: "02",
              title: "Book your flight",
              body: "Reserve a 1:1 session or enroll in a self-paced course.",
            },
            {
              n: "03",
              title: "Glide forward",
              body: "Learn at your pace, with real feedback along the way.",
            },
          ].map(step => (
            <div key={step.n} className="text-center sm:text-left">
              <div className="font-mono text-sm text-[#C9A227]">{step.n}</div>
              <h3 className="mt-2 text-xl font-medium text-[#14213D] dark:text-[#F5F3EE]">
                {step.title}
              </h3>
              <p className="mt-2 text-[#14213D]/70 dark:text-[#F5F3EE]/70">
                {step.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- CATEGORIES ---------- */}
      <section className="container pb-20 sm:pb-28">
        <div className="flex flex-wrap items-center justify-center gap-3">
          {[
            { icon: Code2, label: "Code" },
            { icon: Palette, label: "Design" },
            { icon: Calculator, label: "Math" },
            { icon: Languages, label: "Languages" },
            { icon: Briefcase, label: "Business" },
            { icon: Music, label: "Music" },
          ].map(({ icon: Icon, label }) => (
            <span
              key={label}
              className="flex items-center gap-2 rounded-full border border-[#14213D]/15 bg-white/60 px-4 py-2 text-sm font-medium text-[#14213D] dark:border-[#F5F3EE]/15 dark:bg-white/[.04] dark:text-[#F5F3EE]"
            >
              <Icon className="h-4 w-4 text-[#6FA8DC]" />
              {label}
            </span>
          ))}
        </div>
      </section>

      {/* ---------- CTA BANNER ---------- */}
      <section className="bg-[#14213D] py-20 dark:bg-[#0B0F1A] sm:py-24">
        <div className="container flex flex-col items-center gap-6 text-center">
          <h2
            className="text-3xl font-medium text-[#F5F3EE] sm:text-4xl"
            style={{ fontFamily: "'Fraunces', serif" }}
          >
            Ready for takeoff?
          </h2>
          <p className="max-w-md text-[#F5F3EE]/70">
            Join learners and tutors already gliding through their goals on
            PaperGlidr.
          </p>
          <Link
            href="/sign-up"
            className="inline-flex items-center justify-center rounded-full bg-[#C9A227] px-8 py-3 text-sm font-medium text-[#14213D] transition-colors hover:bg-[#dab236]"
          >
            Get Started Free
          </Link>
        </div>
      </section>

      {/* ---------- FOOTER ---------- */}
      <footer className="container flex flex-col items-center justify-between gap-4 py-10 text-sm text-[#14213D]/60 dark:text-[#F5F3EE]/50 sm:flex-row">
        <span style={{ fontFamily: "'Fraunces', serif" }}>PaperGlidr</span>
        <span>&copy; {new Date().getFullYear()} PaperGlidr. All rights reserved.</span>
      </footer>

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
  )
}
