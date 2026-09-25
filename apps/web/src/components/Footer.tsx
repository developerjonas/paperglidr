import Link from "next/link";
import { eq } from "drizzle-orm";
import { Logo } from "@/components/Logo";
import { Badge } from "@/components/ui/badge";
import { getCurrentUser } from "@/services/auth";
import { canAccessAdminPages } from "@/permissions/general";
import { db } from "@/drizzle/db";
import { InstructorTable } from "@/drizzle/schema";
import { COMPANY, companyRegistrationDisplay } from "@/config/company";
import { LEGAL_PAGES } from "@/config/legalPages";

type FooterProps = {
  isAdminPage?: boolean;
};

type FooterColumn = {
  title: string;
  links: { href: string; label: string; tone?: "admin" }[];
};

export async function Footer({ isAdminPage = false }: FooterProps) {
  const currentYear = new Date().getFullYear();
  const user = await getCurrentUser({ allData: true });
  const isSignedIn = user?.userId != null;
  const isAdmin = isSignedIn ? canAccessAdminPages(user) : false;

  let isInstructor = false;
  if (isSignedIn && !isAdmin) {
    const instructor = await db.query.InstructorTable.findFirst({
      where: eq(InstructorTable.userId, user.userId!),
      columns: { id: true },
    });
    isInstructor = instructor != null;
  }

  // The teaching column mirrors the navbar's role logic.
  const teachColumn: FooterColumn = isAdmin
    ? {
        title: "Admin",
        links: [{ href: "/admin", label: "Admin Dashboard", tone: "admin" }],
      }
    : isInstructor
      ? {
          title: "Teach",
          links: [
            { href: "/teach/courses", label: "Course Studio" },
            { href: "/teach/sales", label: "Sales" },
            { href: "/teach/payouts", label: "Payouts" },
          ],
        }
      : {
          title: "Teach",
          links: [
            { href: "/instructors/onboarding", label: "Become a Tutor" },
            { href: "/#how-it-works", label: "How it works" },
          ],
        };

  const columns: FooterColumn[] = [
    {
      title: "Learn",
      links: [
        { href: "/browse", label: "Browse Courses" },
        { href: "/courses", label: "My Courses" },
        { href: "/certificates", label: "My Certificates" },
        { href: "/account", label: "Account Settings" },
      ],
    },
    teachColumn,
    {
      title: "Legal & Support",
      links: [
        ...LEGAL_PAGES.map((page) => ({ href: page.href, label: page.title })),
        { href: "/legal", label: "All policies" },
        { href: "/contact", label: "Contact Us" },
      ],
    },
  ];

  return (
    <footer className="section-muted w-full border-t">
      <div className="mx-auto w-full max-w-7xl px-4 pb-10 pt-14 sm:px-6 sm:pt-16 lg:px-8">
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-12">
          <div className="col-span-2 space-y-4 md:col-span-5">
            <Logo>
              {isAdminPage && (
                <Badge
                  variant="secondary"
                  className="rounded-full border border-amber-500/30 bg-amber-500/10 text-[10px] not-italic text-amber-600"
                >
                  STUDIO
                </Badge>
              )}
            </Logo>
            <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
              Online courses from Nepali instructors, priced in rupees and
              paid with the wallets students already use.
            </p>
            <address className="text-xs not-italic leading-relaxed text-muted-foreground/80">
              {COMPANY.legalName}
              <br />
              {COMPANY.registeredAddress}
              <br />
              Company registration: {companyRegistrationDisplay}
            </address>
          </div>

          {columns.map((column, i) => (
            <div
              key={column.title}
              className={
                i === columns.length - 1
                  ? "col-span-2 sm:col-span-1 md:col-span-3"
                  : "md:col-span-2"
              }
            >
              <h4 className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
                {column.title}
              </h4>
              <ul className="mt-4 space-y-3 text-sm">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className={
                        link.tone === "admin"
                          ? "font-medium text-amber-600 transition-colors hover:text-amber-500 dark:text-amber-400"
                          : "text-foreground/75 transition-colors hover:text-foreground"
                      }
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 border-t pt-6">
          <p className="text-xs text-muted-foreground">
            &copy; {currentYear} {COMPANY.legalName}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
