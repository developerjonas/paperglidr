import Link from "next/link"

// Colors match the navy CTA banner + gold accent visible in the current
// landing page. If these are already tokens in tailwind.config (e.g.
// colors.navy[900], colors.gold[400]) swap the bracket values below for
// those class names instead of the raw hex — kept as arbitrary values here
// since I don't have your actual config to confirm the token names.
const NAVY_900 = "#0F1B2E"
const NAVY_800 = "#16233A"
const GOLD_400 = "#D4A24C"
const IVORY_100 = "#EDEAE2"
const SLATE_400 = "#8B93A6"

const productLinks = [
  { label: "Browse Courses", href: "/courses" },
  { label: "Become an Instructor", href: "/instructors/onboarding" },
  { label: "Get Started", href: "/sign-up" },
]

const companyLinks = [
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
]

const legalLinks = [
  { label: "Terms of Service", href: "/legal/terms" },
  { label: "Content Policy", href: "/legal/content-policy" },
  { label: "DMCA & Takedown", href: "/legal/dmca" },
]

const paymentRails = ["eSewa", "Khalti", "Fonepay"]

export function Footer() {
  return (
    <footer style={{ backgroundColor: NAVY_900 }} className="w-full">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-[1.3fr_1fr_1fr_1fr]">
          {/* Wordmark + tagline + payment rails — the signature callback to
              the hero's "get paid how your students pay" banner */}
          <div className="flex flex-col gap-6">
            <span
              className="font-serif text-2xl tracking-tight"
              style={{ color: IVORY_100 }}
            >
              PAPERGLIDR
            </span>
            <p
              className="max-w-xs text-sm leading-relaxed"
              style={{ color: SLATE_400 }}
            >
              Upload your course, set your price in NPR, get paid straight
              to the wallet you already use.
            </p>
            <div className="flex flex-wrap gap-2">
              {paymentRails.map(rail => (
                <span
                  key={rail}
                  className="rounded-full border px-3 py-1 text-xs"
                  style={{
                    borderColor: "rgba(237, 234, 226, 0.2)",
                    color: IVORY_100,
                  }}
                >
                  {rail}
                </span>
              ))}
            </div>
          </div>

          <FooterColumn heading="Product" links={productLinks} />
          <FooterColumn heading="Company" links={companyLinks} />
          <FooterColumn heading="Legal" links={legalLinks} />
        </div>

        {/* Hairline matches the thin dividers used elsewhere in this style
            of layout rather than a heavier border */}
        <div
          className="mt-14 flex flex-col gap-4 border-t pt-6 sm:flex-row sm:items-center sm:justify-between"
          style={{ borderColor: "rgba(237, 234, 226, 0.12)" }}
        >
          <p className="text-xs" style={{ color: SLATE_400 }}>
            © {new Date().getFullYear()} Paperglidr Technology Pvt. Ltd.
            &nbsp;·&nbsp; Lalitpur, Nepal
          </p>
          <div className="flex gap-6">
            {legalLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className="text-xs transition-colors hover:opacity-80"
                style={{ color: SLATE_400 }}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}

function FooterColumn({
  heading,
  links,
}: {
  heading: string
  links: { label: string; href: string }[]
}) {
  return (
    <div className="flex flex-col gap-4">
      <span
        className="text-xs font-medium uppercase tracking-widest"
        style={{ color: GOLD_400 }}
      >
        {heading}
      </span>
      <ul className="flex flex-col gap-3">
        {links.map(link => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="text-sm transition-colors hover:opacity-80"
              style={{ color: IVORY_100 }}
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
