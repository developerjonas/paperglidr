import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowRight,
  BadgeCheck,
  BookOpen,
  CheckCircle2,
  Check,
  FileText,
  FolderPlus,
  GraduationCap,
  Link2,
  Lock,
  MessageSquare,
  Package,
  PlayCircle,
  Search,
  ShieldCheck,
  Smartphone,
  Tag,
  TrendingUp,
  Upload,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { CircuitLines } from "@/components/marketing/CircuitLines";
import { StudioWindow } from "@/components/marketing/StudioWindow";
import { ProductCard } from "@/features/products/components/ProductCard";
import { getPublicProducts } from "@/features/products/db/products";
import { getPublicCategories } from "@/features/categories/db/categories";
import { POLICY_TERMS } from "@/config/policyTerms";
import { SITE_DESCRIPTION, SITE_NAME, pageMetadata } from "@/lib/site";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  ...pageMetadata({
    title: `${SITE_NAME} — Learn from Nepali instructors, pay in NPR`,
    description: SITE_DESCRIPTION,
    path: "/",
  }),
  // The home title stands alone (no "· Chiyali" suffix).
  title: { absolute: `${SITE_NAME} — Learn from Nepali instructors, pay in NPR` },
};

// Every number below comes from the constants the code enforces.
const {
  creatorSharePercent,
  platformFeePercent,
  refundWindowDays,
  refundCompletionThresholdPercent,
  minimumPayout,
  payoutHoldDays,
  payoutRequiresVerifiedPhone,
  referralWindowDays,
} = POLICY_TERMS;

const TRUST_LINE = "Free to publish · Priced in NPR · eSewa, Khalti & Fonepay";

const STUDIO_ACTIONS = [
  { icon: FolderPlus, label: "Create a course", where: ["Courses"] },
  { icon: PlayCircle, label: "Add a video lesson", where: ["Course", "Section"] },
  { icon: FileText, label: "Attach PDFs and course files", where: ["Lesson"] },
  { icon: Package, label: "Bundle courses into one product", where: ["Products"] },
  { icon: Wallet, label: "Set your price in NPR", where: ["Product"] },
  { icon: Tag, label: "Create a discount code", where: ["Discounts"] },
  { icon: MessageSquare, label: "Answer student questions", where: ["Lesson", "Q&A"] },
  { icon: TrendingUp, label: "See today's sales", where: ["Sales"] },
  { icon: ArrowRight, label: "Request a payout", where: ["Payouts"] },
];

const PAYMENT_METHODS = [
  { name: "eSewa", detail: "Digital wallet", tile: "bg-[#60BB46]", letter: "e" },
  { name: "Khalti", detail: "Digital wallet", tile: "bg-[#5C2D91]", letter: "K" },
  { name: "Fonepay", detail: "QR payment from a bank app", tile: "bg-[#C8102E]", letter: "F" },
];

const FAQS = [
  {
    q: "Is it free to publish a course?",
    a: `Yes. There is no sign-up fee and no monthly plan. ${SITE_NAME} keeps ${platformFeePercent.referralLink}% of a sale made through your own link and ${platformFeePercent.platform}% of a sale we bring you through the marketplace. You keep the rest.`,
  },
  {
    q: "How do students pay?",
    a: "In Nepali rupees, with eSewa, Khalti or a Fonepay QR code from any bank app. No foreign card needed.",
  },
  {
    q: "When do I get paid?",
    a: `Earnings from a sale become withdrawable ${payoutHoldDays} days after the sale, once its refund window has closed. Request a payout from your dashboard any time your balance reaches ${minimumPayout}${payoutRequiresVerifiedPhone ? "; you'll need to verify your phone number first" : ""}.`,
  },
  {
    q: "What counts as a sale through my own link?",
    a: `Share your course with ?ref=your-handle on the end of the link. Anyone who buys your course within ${referralWindowDays} days of clicking it counts as yours, and you keep ${creatorSharePercent.referralLink}%.`,
  },
  {
    q: "Does my course need approval?",
    a: "There's no application and no waitlist. Sign up, build your course, and submit it when it's ready. We check each course before it goes on sale.",
  },
  {
    q: "Can students get a refund?",
    a: `Yes, if they ask within ${refundWindowDays} days of buying and have completed less than ${refundCompletionThresholdPercent}% of the course's lessons.`,
  },
  {
    q: "Do students get a certificate?",
    a: "Yes. A certificate is issued automatically when a student completes a course, and anyone can verify it online.",
  },
];

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-sm font-medium text-primary">{children}</p>
  );
}

function CheckList({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="mt-8 space-y-3.5">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-3 text-[15px] text-foreground/80 sm:text-base">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 fill-success text-background" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function Section({
  muted = false,
  className,
  id,
  children,
}: {
  muted?: boolean;
  className?: string;
  id?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className={cn(
        "scroll-mt-20 py-20 sm:py-28",
        muted && "section-muted",
        className,
      )}
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">{children}</div>
    </section>
  );
}

export default async function HomePage() {
  const [products, categories] = await Promise.all([
    getPublicProducts(),
    getPublicCategories(),
  ]);

  return (
    <div className="flex flex-col overflow-x-clip">
      {/* ---------- HERO ---------- */}
      <section className="relative pt-16 sm:pt-24">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-center px-4 text-center sm:px-6 lg:px-8">
          <h1 className="heading-display max-w-3xl text-[2.6rem] sm:text-6xl lg:text-7xl">
            The course platform
            <br className="hidden sm:block" /> built for Nepal.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
            Publish a course in minutes, price it in rupees, and sell to
            students who pay with eSewa, Khalti or Fonepay. No foreign cards,
            no dollar pricing, no waitlist.
          </p>

          <div className="relative mt-10 w-full">
            <CircuitLines />
            <div className="relative flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild size="lg" className="w-full shadow-lg shadow-primary/25 sm:w-auto">
                <Link href="/instructors/onboarding">
                  <Upload /> Start teaching free
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
                <Link href="/browse">Browse courses</Link>
              </Button>
            </div>
          </div>

          <p className="mt-6 text-sm text-muted-foreground">{TRUST_LINE}</p>
        </div>

        <div className="relative mx-auto mt-16 w-full max-w-6xl px-4 sm:mt-20 sm:px-6 lg:px-8">
          <StudioWindow />
        </div>
        <div className="h-20 sm:h-28" />
      </section>

      {/* ---------- ONE STUDIO ---------- */}
      <Section muted>
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="heading-display text-4xl sm:text-5xl">
            Your whole course,
            <br /> one studio.
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
            Lessons, files, pricing, discounts, student questions, sales and
            payouts all live in one Creator Studio. No plugins to wire
            together, no spreadsheet on the side.
          </p>
        </div>

        <div className="window mx-auto mt-14 max-w-3xl" aria-hidden="true">
          <div className="flex items-center gap-3 border-b px-5 py-4">
            <Search className="h-4 w-4 text-muted-foreground" />
            <span className="text-[15px] text-muted-foreground">
              What do you want to do?
            </span>
          </div>
          <ul className="p-2">
            {STUDIO_ACTIONS.map(({ icon: Icon, label, where }, i) => (
              <li
                key={label}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] sm:text-[15px]",
                  i === 0 && "bg-accent",
                )}
              >
                <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1 truncate">{label}</span>
                <span className="hidden gap-1.5 sm:flex">
                  {where.map((w) => (
                    <span key={w} className="kbd">
                      {w}
                    </span>
                  ))}
                </span>
              </li>
            ))}
          </ul>
          <div className="flex items-center justify-end gap-2 border-t bg-surface px-5 py-3 text-xs text-muted-foreground">
            Everything lives in <span className="kbd">/teach</span>
          </div>
        </div>
      </Section>

      {/* ---------- PAYMENTS ---------- */}
      <Section>
        <div className="grid items-center gap-16 lg:grid-cols-2">
          <div>
            <h2 className="heading-display text-4xl sm:text-5xl">
              Checkout the way
              <br /> Nepal pays.
            </h2>
            <p className="mt-5 max-w-lg text-lg leading-relaxed text-muted-foreground">
              Students pay with the wallets already on their phone, in the
              currency they earn in. Nothing fails at a foreign card form.
            </p>
            <CheckList
              items={[
                "eSewa, Khalti and Fonepay QR at checkout",
                "Prices shown and charged in NPR",
                "An invoice emailed for every purchase",
                `Refunds within ${refundWindowDays} days if less than ${refundCompletionThresholdPercent}% is completed`,
              ]}
            />
          </div>

          <div className="relative mx-auto w-full max-w-lg py-8" aria-hidden="true">
            <div className="window">
              <div className="flex items-center gap-2 border-b px-5 py-4 text-sm font-medium">
                <Smartphone className="h-4 w-4 text-muted-foreground" /> Payment methods
              </div>
              <ul className="divide-y px-3">
                {PAYMENT_METHODS.map(({ name, detail, tile, letter }) => (
                  <li key={name} className="flex items-center gap-4 px-2 py-4">
                    <span
                      className={cn(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg font-bold text-white",
                        tile,
                      )}
                    >
                      {letter}
                    </span>
                    <div className="min-w-0 flex-1 leading-tight">
                      <p className="text-sm font-semibold">{name}</p>
                      <p className="truncate text-xs text-muted-foreground">{detail}</p>
                    </div>
                    <CheckCircle2 className="h-5 w-5 shrink-0 fill-success text-background" />
                  </li>
                ))}
              </ul>
            </div>
            <span className="absolute -right-2 top-0 flex h-16 w-16 rotate-6 items-center justify-center rounded-2xl bg-[#60BB46] text-2xl font-bold text-white shadow-xl sm:-right-5">
              e
            </span>
            <span className="absolute -bottom-3 -left-3 flex h-16 w-16 -rotate-6 sm:-left-7 items-center justify-center rounded-2xl bg-[#5C2D91] text-2xl font-bold text-white shadow-xl">
              K
            </span>
          </div>
        </div>
      </Section>

      {/* ---------- FEATURED COURSES ---------- */}
      <Section muted>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Eyebrow>For students</Eyebrow>
            <h2 className="heading-display mt-2 text-4xl sm:text-5xl">
              Learn from Nepali instructors.
            </h2>
          </div>
          <Link
            href="/browse"
            className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            View all courses <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {categories.length > 0 && (
          <div className="no-scrollbar -mx-4 mt-8 flex items-center gap-2 overflow-x-auto px-4 py-1 sm:mx-0 sm:px-0">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/browse?category=${category.slug}`}
                className="inline-flex shrink-0 items-center rounded-full border bg-background px-4 py-1.5 text-sm text-foreground/75 transition-colors hover:border-foreground/20 hover:text-foreground"
              >
                {category.name}
              </Link>
            ))}
          </div>
        )}

        <div className="mt-8">
          {products.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {products.slice(0, 8).map((product) => (
                <ProductCard key={product.id} {...product} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed bg-background p-12 text-center">
              <BookOpen className="mx-auto h-10 w-10 text-muted-foreground/60" />
              <h3 className="mt-4 text-lg font-semibold">No courses published yet</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Check back soon — instructors are preparing new content.
              </p>
            </div>
          )}
        </div>
      </Section>

      {/* ---------- BUILT FOR NEPAL ---------- */}
      <Section>
        <div className="grid items-center gap-14 lg:grid-cols-2">
          <div className="order-2 grid grid-cols-2 border-t lg:order-1">
            {[
              { icon: Wallet, big: "NPR", small: "prices and payouts in rupees" },
              { icon: Link2, big: `${creatorSharePercent.referralLink}%`, small: "of sales through your link" },
              { icon: ShieldCheck, big: `${refundWindowDays} days`, small: "refund window for students" },
              { icon: TrendingUp, big: minimumPayout, small: "minimum payout" },
            ].map(({ icon: Icon, big, small }, i) => (
              <div
                key={small}
                className={cn("border-b p-5 sm:p-7", i % 2 === 0 && "border-r")}
              >
                <Icon className="h-5 w-5 text-primary" />
                <p className="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl">{big}</p>
                <p className="mt-1 text-sm text-muted-foreground">{small}</p>
              </div>
            ))}
          </div>
          <div className="order-1 lg:order-2">
            <h2 className="heading-display text-4xl sm:text-5xl">
              Built for Nepal,
              <br /> not translated for it.
            </h2>
            <p className="mt-5 max-w-lg text-lg leading-relaxed text-muted-foreground">
              Global course platforms price in dollars, pay out to foreign
              accounts and take cards your students don&apos;t have.{" "}
              {SITE_NAME} works in rupees from the first lesson to the payout
              that lands in your account.
            </p>
          </div>
        </div>
      </Section>

      {/* ---------- HOW IT WORKS ---------- */}
      <Section muted id="how-it-works">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="heading-display text-4xl sm:text-5xl">From idea to first sale.</h2>
          <p className="mt-5 text-lg text-muted-foreground">
            No application, no waitlist. Four steps, all from your dashboard.
          </p>
        </div>
        <div className="mt-14 grid border-t sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Upload, title: "Upload your course", body: "Add videos and files, arrange lessons into sections, write a description." },
            { icon: Wallet, title: "Set a price in NPR", body: "Decide what it's worth. Change it any time, or run a discount code." },
            { icon: Link2, title: "Share your link", body: `Sales through your own link earn you ${creatorSharePercent.referralLink}%. The marketplace brings you more.` },
            { icon: BadgeCheck, title: "Request your payout", body: `Earnings unlock after the ${payoutHoldDays}-day refund window. Withdraw from ${minimumPayout}.` },
          ].map(({ icon: Icon, title, body }, i) => (
            <div
              key={title}
              className={cn(
                "border-b p-6 sm:p-7",
                i % 2 === 0 && "sm:border-r",
                i < 3 && "lg:border-r",
              )}
            >
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs text-muted-foreground">0{i + 1}</span>
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="mt-4 text-lg font-semibold tracking-tight">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ---------- PRICING ---------- */}
      <Section>
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div className="lg:pl-12">
            <h2 className="heading-display text-4xl sm:text-5xl">
              Free to publish.
              <br /> We earn when you do.
            </h2>
            <p className="mt-5 text-lg text-muted-foreground">
              No monthly plan. No setup fee. A share of each sale, and nothing
              if nothing sells.
            </p>
          </div>
          <div className="window mx-auto w-full max-w-md p-7 sm:p-8">
            <p className="flex items-baseline gap-2">
              <span className="text-5xl font-semibold tracking-tight">NPR 0</span>
              <span className="text-muted-foreground">to start</span>
            </p>
            <div className="mt-6 space-y-3 border-y py-5 text-sm">
              <div className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground">Sales through your link</span>
                <span className="font-semibold">You keep {creatorSharePercent.referralLink}%</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground">Sales from the marketplace</span>
                <span className="font-semibold">You keep {creatorSharePercent.platform}%</span>
              </div>
            </div>
            <Button asChild size="lg" className="mt-6 w-full">
              <Link href="/instructors/onboarding">Start teaching free</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="mt-3 w-full">
              <Link href="/creator-terms">Read the creator terms</Link>
            </Button>
            <p className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
              <Check className="h-4 w-4 text-success" /> Payouts in NPR, from {minimumPayout}
            </p>
            <p className="mt-3 flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
              <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              Students pay through eSewa, Khalti or Fonepay. We handle
              checkout, refunds and invoices.
            </p>
          </div>
        </div>
      </Section>

      {/* ---------- FAQ ---------- */}
      <Section muted>
        <div className="mx-auto max-w-3xl">
          <h2 className="heading-display text-4xl sm:text-5xl">Frequently asked questions</h2>
          <Accordion type="single" collapsible className="mt-10">
            {FAQS.map(({ q, a }) => (
              <AccordionItem key={q} value={q}>
                <AccordionTrigger className="py-5 text-base font-medium hover:no-underline sm:text-lg">
                  {q}
                </AccordionTrigger>
                <AccordionContent className="pb-5 text-[15px] leading-relaxed text-muted-foreground">
                  {a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </Section>

      {/* ---------- CTA ---------- */}
      <Section>
        <div className="relative overflow-hidden rounded-3xl border bg-surface px-6 py-20 text-center sm:py-24">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-full bg-[radial-gradient(ellipse_60%_55%_at_50%_0%,hsl(var(--primary)/0.14),transparent_70%)]"
          />
          <div className="relative">
            <GraduationCap className="mx-auto h-8 w-8 text-primary" />
            <h2 className="heading-display mx-auto mt-6 max-w-2xl text-4xl sm:text-5xl">
              Your course is worth publishing today.
            </h2>
            <p className="mx-auto mt-4 max-w-md text-lg text-muted-foreground">
              Set up your creator page and publish your first lesson before
              the day is over.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild size="lg" className="w-full sm:w-auto">
                <Link href="/instructors/onboarding">Start teaching free</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
                <Link href="/browse">Browse courses</Link>
              </Button>
            </div>
            <p className="mt-6 text-sm text-muted-foreground">{TRUST_LINE}</p>
          </div>
        </div>
      </Section>
    </div>
  );
}
