import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  GraduationCap,
  Shield,
  User,
  FileText,
  HelpCircle,
} from "lucide-react";

type FooterProps = {
  isAdminPage?: boolean;
};

export function Footer({ isAdminPage = false }: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-white/20 bg-white/40 shadow-[0_-1px_0_0_rgba(255,255,255,0.4)_inset] backdrop-blur-2xl backdrop-saturate-150 dark:border-white/10 dark:bg-black/30 dark:shadow-[0_-1px_0_0_rgba(255,255,255,0.05)_inset]">
      <div className="container mx-auto px-4 py-10 sm:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Brand & Identity Column */}
          <div className="space-y-3 md:col-span-1">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-lg font-extrabold tracking-tight"
            >
              PAPERGLIDR
              {isAdminPage && (
                <Badge
                  variant="secondary"
                  className="border border-amber-500/30 bg-amber-500/10 text-xs text-amber-600 backdrop-blur-sm"
                >
                  STUDIO
                </Badge>
              )}
            </Link>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Empowering lifelong learning and course creation. High-quality
              structured content for students and tutors.
            </p>
          </div>

          {/* Quick Navigation */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
              Learning
            </h4>
            <ul className="space-y-2 text-sm font-medium text-muted-foreground">
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

          {/* Instructor / Studio Navigation */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
              Instructors
            </h4>
            <ul className="space-y-2 text-sm font-medium text-muted-foreground">
              <li>
                <Link
                  href="/teach"
                  className="transition-colors hover:text-foreground"
                >
                  Teach on Paperglidr
                </Link>
              </li>
              <li>
                <Link
                  href="/teach/courses"
                  className="transition-colors hover:text-foreground"
                >
                  Course Studio
                </Link>
              </li>
              <li>
                <Link
                  href="/admin"
                  className="inline-flex items-center gap-1.5 font-semibold text-amber-600 transition-colors hover:text-amber-500"
                >
                  <Shield className="h-3.5 w-3.5" />
                  Admin Dashboard
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal / System Information */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
              Support & Legal
            </h4>
            <ul className="space-y-2 text-sm font-medium text-muted-foreground">
              <li>
                <Link
                  href="/tos"
                  className="transition-colors hover:text-foreground"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  href="/dmca"
                  className="transition-colors hover:text-foreground"
                >
                  DMCA Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/content"
                  className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
                >
                  <HelpCircle className="h-3.5 w-3.5" />
                  Help & Content Guidelines
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 sm:flex-row dark:border-white/5">
          <p className="text-xs text-muted-foreground">
            &copy; {currentYear} PAPERGLIDR. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>Powered by Jonas</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
