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
      <section className="relative overflow-hidden section-muted border-b py-14 md:py-20">

        <div className="container mx-auto px-4">
          <h1 className="heading-display text-3xl sm:text-4xl">
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
              <Card className="h-full border-border bg-card shadow-sm">
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
