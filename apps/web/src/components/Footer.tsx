import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { getCurrentUser } from "@/services/clerk";
import { canAccessAdminPages } from "@/permissions/general";
import { db } from "@/drizzle/db";
import { InstructorTable } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import {
  GraduationCap,
  Shield,
  User,
  FileText,
  HelpCircle,
  ShieldCheck,
  Scale,
  RotateCcw,
  MessageSquareWarning,
  Presentation,
  BookOpen,
  Wallet,
} from "lucide-react";

type FooterProps = {
  isAdminPage?: boolean;
};

// Legal/marketing pages live on the landing app's domain, not this app.
// Set NEXT_PUBLIC_LANDING_URL (e.g. "https://paperglidr.com") in your env.
const LANDING_URL = process.env.NEXT_PUBLIC_LANDING_URL ?? "";

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

  return (
    <footer className="w-full border-t border-white/20 bg-white/40 shadow-[0_-1px_0_0_rgba(255,255,255,0.4)_inset] backdrop-blur-2xl backdrop-saturate-150 dark:border-white/10 dark:bg-black/30 dark:shadow-[0_-1px_0_0_rgba(255,255,255,0.05)_inset]">
      <div className="container mx-auto px-4 py-10 sm:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* ---------------- Brand & Identity ---------------- */}
          <div className="space-y-3 md:col-span-1">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-lg font-extrabold tracking-tight"
            >
              PAPERGLIDR
              {isAdminPage && (
                <Badge
                  variant="secondary"
                  className="rounded-[5px] border border-amber-500/30 bg-amber-500/10 text-xs text-amber-600 backdrop-blur-sm"
                >
                  STUDIO
                </Badge>
              )}
            </Link>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Empowering lifelong learning and course creation. High-quality
              structured content for students and tutors across Nepal.
            </p>
            <div className="flex items-center gap-1.5 pt-1 text-[11px] font-medium text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" />
              Registered e-commerce business in Nepal
            </div>
          </div>

          {/* ---------------- Learning ---------------- */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
              Learning
            </h4>
            <ul className="space-y-2 text-sm font-medium text-muted-foreground">
              <li>
                <Link
                  href="/browse"
                  className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
                >
                  <BookOpen className="h-3.5 w-3.5" />
                  Browse Courses
                </Link>
              </li>
              <li>
                <Link
                  href="/courses"
                  className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
                >
                  <GraduationCap className="h-3.5 w-3.5" />
                  My Courses
                </Link>
              </li>
              <li>
                <Link
                  href="/certificates"
                  className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
                >
                  <FileText className="h-3.5 w-3.5" />
                  My Certificates
                </Link>
              </li>
              <li>
                <Link
                  href="/account"
                  className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
                >
                  <User className="h-3.5 w-3.5" />
                  Account Settings
                </Link>
              </li>
            </ul>
          </div>

          {/* ---------------- Teaching (mirrors navbar's role logic) ---------------- */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
              {isAdmin ? "Admin" : "Instructors"}
            </h4>
            <ul className="space-y-2 text-sm font-medium text-muted-foreground">
              {isAdmin ? (
                <li>
                  <Link
                    href="/admin"
                    className="inline-flex items-center gap-1.5 font-semibold text-amber-600 transition-colors hover:text-amber-500"
                  >
                    <Shield className="h-3.5 w-3.5" />
                    Admin Dashboard
                  </Link>
                </li>
              ) : isInstructor ? (
                <>
                  <li>
                    <Link
                      href="/teach/courses"
                      className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
                    >
                      <BookOpen className="h-3.5 w-3.5" />
                      Course Studio
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/teach/payouts"
                      className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
                    >
                      <Wallet className="h-3.5 w-3.5" />
                      Payouts
                    </Link>
                  </li>
                </>
              ) : (
                <li>
                  <Link
                    href="/instructors/onboarding"
                    className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
                  >
                    <Presentation className="h-3.5 w-3.5" />
                    Become a Tutor
                  </Link>
                </li>
              )}
              <li>
                <a
                  href={`${LANDING_URL}/blog`}
                  className="transition-colors hover:text-foreground"
                >
                  Instructor Blog
                </a>
              </li>
            </ul>
          </div>

          {/* ---------------- Legal & Support (E-Commerce Act required) ---------------- */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
              Legal & Support
            </h4>
            <ul className="space-y-2 text-sm font-medium text-muted-foreground">
              <li>
                <a
                  href={`${LANDING_URL}/legal`}
                  className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
                >
                  <Scale className="h-3.5 w-3.5" />
                  Business & Registration Info
                </a>
              </li>
              <li>
                <a
                  href={`${LANDING_URL}/privacy`}
                  className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
                >
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Privacy Policy
                </a>
              </li>
              <li>
                <a
                  href={`${LANDING_URL}/refund-policy`}
                  className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Refund Policy
                </a>
              </li>
              <li>
                <a
                  href={`${LANDING_URL}/tos`}
                  className="transition-colors hover:text-foreground"
                >
                  Terms of Service
                </a>
              </li>
              <li>
                <a
                  href={`${LANDING_URL}/dmca`}
                  className="transition-colors hover:text-foreground"
                >
                  DMCA Policy
                </a>
              </li>
              <li>
                <a
                  href={`${LANDING_URL}/content`}
                  className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
                >
                  <HelpCircle className="h-3.5 w-3.5" />
                  Help & Content Guidelines
                </a>
              </li>
              <li>
                <a
                  href={`${LANDING_URL}/contact`}
                  className="inline-flex items-center gap-1.5 font-semibold text-foreground/90 transition-colors hover:text-primary"
                >
                  <MessageSquareWarning className="h-3.5 w-3.5" />
                  File a Complaint / Contact Us
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* ---------------- Bottom Bar ---------------- */}
        <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 text-center sm:flex-row sm:text-left dark:border-white/5">
          <p className="text-xs text-muted-foreground">
            &copy; {currentYear} PaperGlidr. All rights reserved. A registered
            e-commerce company in Nepal.
          </p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>Powered by Jonas</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
