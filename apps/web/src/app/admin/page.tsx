import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { db } from "@/drizzle/db";
import {
  CategoryTable,
  CourseSectionTable,
  CourseTable,
  LessonTable,
  ProductTable,
  PurchaseTable,
  UserCourseAccessTable,
} from "@/drizzle/schema";
import { getCourseGlobalTag } from "@/features/courses/db/cache/courses";
import { getUserCourseAccessGlobalTag } from "@/features/courses/db/cache/userCourseAccess";
import { getCourseSectionGlobalTag } from "@/features/courseSections/db/cache";
import { getLessonGlobalTag } from "@/features/lessons/db/cache/lessons";
import { getProductGlobalTag } from "@/features/products/db/cache";
import { getPurchaseGlobalTag } from "@/features/purchases/db/cache";
import { getCategoryGlobalTag } from "@/features/categories/db/cache";
import { formatNumber, formatPrice } from "@/lib/formatters";
import { count, countDistinct, isNotNull, sql, sum } from "drizzle-orm";
import { cacheTag } from "next/dist/server/use-cache/cache-tag";
import Link from "next/link";
import {
  BookOpenIcon,
  DollarSignIcon,
  FolderIcon,
  LayersIcon,
  LifeBuoyIcon,
  PackageIcon,
  StarIcon,
  WalletIcon,
} from "lucide-react";
import { ReactNode } from "react";

const MANAGEMENT_LINKS = [
  {
    title: "Categories",
    description: "Manage course categories and metadata",
    href: "/admin/categories",
    icon: FolderIcon,
  },
  {
    title: "Products",
    description: "Manage digital products and pricing",
    href: "/admin/products",
    icon: PackageIcon,
  },
  {
    title: "Courses",
    description: "Manage courses, sections, and lessons",
    href: "/admin/courses",
    icon: BookOpenIcon,
  },
  {
    title: "Payouts",
    description: "Review and process instructor payout requests",
    href: "/admin/payouts",
    icon: WalletIcon,
  },
  {
    title: "Reviews",
    description: "Moderate course reviews and instructor replies",
    href: "/admin/reviews",
    icon: StarIcon,
  },
  {
    title: "Revenue",
    description: "Platform revenue, monthly trends, and referral split",
    href: "/admin/revenue",
    icon: DollarSignIcon,
  },
  {
    title: "Support",
    description: "Respond to open support tickets",
    href: "/admin/support",
    icon: LifeBuoyIcon,
  },
];

export default async function AdminPage() {
  const {
    averageNetPurchasesPerCustomer,
    netPurchases,
    netSales,
    refundedPurchases,
    totalRefunds,
  } = await getPurchaseDetails();

  const [
    totalStudents,
    totalCategories,
    totalProducts,
    totalCourses,
    totalCourseSections,
    totalLessons,
  ] = await Promise.all([
    getTotalStudents(),
    getTotalCategories(),
    getTotalProducts(),
    getTotalCourses(),
    getTotalCourseSections(),
    getTotalLessons(),
  ]);

  const STATS = [
    { title: "Net Sales", value: formatPrice(netSales) },
    { title: "Refunded Sales", value: formatPrice(totalRefunds) },
    { title: "Un-Refunded Purchases", value: formatNumber(netPurchases) },
    { title: "Refunded Purchases", value: formatNumber(refundedPurchases) },
    {
      title: "Purchases Per User",
      value: formatNumber(averageNetPurchasesPerCustomer, {
        maximumFractionDigits: 2,
      }),
    },
    { title: "Students", value: formatNumber(totalStudents) },
    { title: "Categories", value: formatNumber(totalCategories) },
    { title: "Products", value: formatNumber(totalProducts) },
    { title: "Courses", value: formatNumber(totalCourses) },
    { title: "Course Sections", value: formatNumber(totalCourseSections) },
    { title: "Lessons", value: formatNumber(totalLessons) },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      {/* ---------------- HERO ---------------- */}
      <section className="relative overflow-hidden border-b border-white/10 bg-gradient-to-b from-primary/5 via-background to-background py-14 md:py-20">
        <div className="absolute top-0 left-1/2 -z-10 h-[280px] w-[480px] -translate-x-1/2 rounded-full bg-primary/10 blur-[120px]" />
        <div className="container mx-auto px-4">
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
            Admin Dashboard
          </h1>
        </div>
      </section>

      {/* ---------------- CONTENT ---------------- */}
      <section className="container mx-auto px-4 py-10">
        <div className="flex flex-col gap-10">
          {/* ---- Stats overview ---- */}
          <div className="flex flex-col gap-4">
            <h2 className="text-lg font-semibold px-1">Overview</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {STATS.map((stat) => (
                <StatCard key={stat.title} title={stat.title}>
                  {stat.value}
                </StatCard>
              ))}
            </div>
          </div>

          {/* ---- Management links ---- */}
          <div className="flex flex-col gap-4">
            <h2 className="text-lg font-semibold px-1">Manage</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {MANAGEMENT_LINKS.map((link) => (
                <LinkCard key={link.href} {...link} />
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function StatCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card className="border-white/30 bg-white/60 shadow-sm backdrop-blur-2xl backdrop-saturate-150 dark:border-white/10 dark:bg-black/40">
      <CardHeader className="text-center">
        <CardDescription className="text-[11px] uppercase tracking-wide">
          {title}
        </CardDescription>
        <CardTitle className="text-2xl font-bold">{children}</CardTitle>
      </CardHeader>
    </Card>
  );
}

function LinkCard({
  title,
  description,
  href,
  icon: Icon,
}: {
  title: string;
  description: string;
  href: string;
  icon: React.FC<React.SVGProps<SVGSVGElement>>;
}) {
  return (
    <Link href={href} className="block transition-transform hover:scale-[1.02]">
      <Card className="h-full border-white/30 bg-white/60 shadow-sm backdrop-blur-2xl backdrop-saturate-150 dark:border-white/10 dark:bg-black/40">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg">{title}</CardTitle>
          <Icon className="h-5 w-5 text-muted-foreground" />
        </CardHeader>
        <CardHeader className="pt-0">
          <CardDescription>{description}</CardDescription>
        </CardHeader>
      </Card>
    </Link>
  );
}

async function getPurchaseDetails() {
  "use cache";
  cacheTag(getPurchaseGlobalTag());

  const data = await db
    .select({
      totalSales: sql<number>`COALESCE(${sum(
        PurchaseTable.pricePaidInPaisa,
      )}, 0)`.mapWith(Number),
      totalPurchases: count(PurchaseTable.id),
      totalUsers: countDistinct(PurchaseTable.userId),
      isRefund: isNotNull(PurchaseTable.refundedAt),
    })
    .from(PurchaseTable)
    .groupBy((table) => table.isRefund);

  const [refundData] = data.filter((row) => row.isRefund);
  const [salesData] = data.filter((row) => !row.isRefund);

  const netSales = (salesData?.totalSales ?? 0) / 100;
  const totalRefunds = (refundData?.totalSales ?? 0) / 100;
  const netPurchases = salesData?.totalPurchases ?? 0;
  const refundedPurchases = refundData?.totalPurchases ?? 0;
  const averageNetPurchasesPerCustomer =
    salesData?.totalUsers != null && salesData.totalUsers > 0
      ? netPurchases / salesData.totalUsers
      : 0;

  return {
    netSales,
    totalRefunds,
    netPurchases,
    refundedPurchases,
    averageNetPurchasesPerCustomer,
  };
}

async function getTotalStudents() {
  "use cache";
  cacheTag(getUserCourseAccessGlobalTag());

  const [data] = await db
    .select({ totalStudents: countDistinct(UserCourseAccessTable.userId) })
    .from(UserCourseAccessTable);

  if (data == null) return 0;
  return data.totalStudents;
}

async function getTotalCategories() {
  "use cache";
  cacheTag(getCategoryGlobalTag());

  const [data] = await db
    .select({ totalCategories: count(CategoryTable.id) })
    .from(CategoryTable);

  if (data == null) return 0;
  return data.totalCategories;
}

async function getTotalCourses() {
  "use cache";
  cacheTag(getCourseGlobalTag());

  const [data] = await db
    .select({ totalCourses: count(CourseTable.id) })
    .from(CourseTable);

  if (data == null) return 0;
  return data.totalCourses;
}

async function getTotalProducts() {
  "use cache";
  cacheTag(getProductGlobalTag());

  const [data] = await db
    .select({ totalProducts: count(ProductTable.id) })
    .from(ProductTable);
  if (data == null) return 0;
  return data.totalProducts;
}

async function getTotalLessons() {
  "use cache";
  cacheTag(getLessonGlobalTag());

  const [data] = await db
    .select({ totalLessons: count(LessonTable.id) })
    .from(LessonTable);
  if (data == null) return 0;
  return data.totalLessons;
}

async function getTotalCourseSections() {
  "use cache";
  cacheTag(getCourseSectionGlobalTag());

  const [data] = await db
    .select({ totalCourseSections: count(CourseSectionTable.id) })
    .from(CourseSectionTable);
  if (data == null) return 0;
  return data.totalCourseSections;
}
