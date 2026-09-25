import {
  BookOpen,
  Briefcase,
  CoinsIcon,
  DollarSign,
  GraduationCap,
  Heart,
  type LucideIcon,
  Package,
  Presentation,
  Shield,
  User,
  Wallet,
} from "lucide-react";

/** What the header needs to know about the viewer — plain data, safe to pass to client components. */
export type NavContext = {
  isLoggedIn: boolean;
  isAdmin: boolean;
  isInstructor: boolean;
  name: string | null;
  email: string | null;
  image: string | null;
  initials: string | null;
};

export type NavItem = {
  href: string;
  label: string;
  icon?: LucideIcon;
  tone?: "admin";
};

export type NavSection = { label: string; items: NavItem[] };

/** Top-level links shown in the header bar and at the top of the drawer. */
export function primaryLinks(ctx: NavContext): NavItem[] {
  return [
    { href: "/browse", label: "Browse" },
    {
      href: ctx.isInstructor ? "/teach" : "/instructors/onboarding",
      label: "Teach",
    },
    { href: ctx.isLoggedIn ? "/support" : "/contact", label: "Support" },
  ];
}

/** Account links, grouped the same way in the account menu and the drawer. */
export function accountSections(ctx: NavContext): NavSection[] {
  if (!ctx.isLoggedIn) return [];

  const sections: NavSection[] = [
    {
      label: "Learning",
      items: [
        { href: "/courses", label: "My Courses", icon: GraduationCap },
        { href: "/certificates", label: "My Certificates", icon: Briefcase },
        { href: "/purchases", label: "My Purchases", icon: CoinsIcon },
        { href: "/wishlist", label: "My Wishlist", icon: Heart },
      ],
    },
  ];

  if (ctx.isAdmin) {
    sections.push({
      label: "Admin",
      items: [
        { href: "/admin", label: "Creator Studio", icon: Shield, tone: "admin" },
      ],
    });
  } else if (ctx.isInstructor) {
    sections.push({
      label: "Teaching",
      items: [
        { href: "/teach/courses", label: "Courses", icon: BookOpen },
        { href: "/teach/products", label: "Products", icon: Package },
        { href: "/teach/sales", label: "Sales", icon: DollarSign },
        { href: "/teach/payouts", label: "Payouts", icon: Wallet },
      ],
    });
  } else {
    sections.push({
      label: "Teaching",
      items: [
        {
          href: "/instructors/onboarding",
          label: "Become a Tutor",
          icon: Presentation,
        },
      ],
    });
  }

  sections.push({
    label: "Account",
    items: [{ href: "/account", label: "Profile", icon: User }],
  });

  return sections;
}

export function isActivePath(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}
