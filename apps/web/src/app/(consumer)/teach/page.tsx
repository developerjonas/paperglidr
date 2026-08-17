import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BookOpen, DollarSign, Package, Wallet } from "lucide-react";
import Link from "next/link";

const TILES = [
  {
    href: "/teach/courses",
    title: "Courses",
    icon: BookOpen,
    description:
      "Create, edit, and organize your courses, sections, and video lessons.",
  },
  {
    href: "/teach/products",
    title: "Products",
    icon: Package,
    description:
      "Bundle your courses together into products and set pricing tiers.",
  },
  {
    href: "/teach/sales",
    title: "Sales",
    icon: DollarSign,
    description:
      "View your purchase history, revenue, and student enrollments.",
  },
  {
    href: "/teach/payouts",
    title: "Payouts",
    icon: Wallet,
    description:
      "Request payouts of your available balance and track past requests.",
  },
];

export default function TeachPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* ---------------- HERO ---------------- */}
      <section className="relative overflow-hidden border-b border-white/10 bg-gradient-to-b from-primary/5 via-background to-background py-14 md:py-20">
        <div className="absolute top-0 left-1/2 -z-10 h-[280px] w-[480px] -translate-x-1/2 rounded-full bg-primary/10 blur-[120px]" />

        <div className="container mx-auto px-4">
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
            Instructor Dashboard
          </h1>
        </div>
      </section>

      {/* ---------------- CONTENT ---------------- */}
      <section className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {TILES.map(({ href, title, icon: Icon, description }) => (
            <Link
              key={href}
              href={href}
              className="transition-transform hover:scale-[1.02]"
            >
              <Card className="h-full border-white/30 bg-white/60 shadow-sm backdrop-blur-2xl backdrop-saturate-150 dark:border-white/10 dark:bg-black/40">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-lg font-bold">{title}</CardTitle>
                  <Icon className="h-6 w-6 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <CardDescription>{description}</CardDescription>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
