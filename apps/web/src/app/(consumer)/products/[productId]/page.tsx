import { SkeletonButton } from "@/components/Skeleton";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { db } from "@/drizzle/db";
import {
  CourseSectionTable,
  LessonTable,
  ProductTable,
} from "@/drizzle/schema";
import { getCourseIdTag } from "@/features/courses/db/cache/courses";
import { getCourseSectionCourseTag } from "@/features/courseSections/db/cache";
import { wherePublicCourseSections } from "@/features/courseSections/permissions/sections";
import { getLessonCourseTag } from "@/features/lessons/db/cache/lessons";
import { wherePublicLessons } from "@/features/lessons/permissions/lessons";
import { getProductIdTag } from "@/features/products/db/cache";
import { userOwnsProduct } from "@/features/products/db/products";
import { wherePublicProducts } from "@/features/products/permissions/products";
import { isProductWishlisted } from "@/features/wishlist/db/wishlist";
import { WishlistButton } from "@/features/wishlist/components/WishlistButton";
import { formatPlural, formatPrice } from "@/lib/formatters";
import { sumArray } from "@/lib/sumArray";
import { getCurrentUser } from "@/services/auth";
import { and, asc, eq } from "drizzle-orm";
import {
  BookOpenIcon,
  CheckCircle2Icon,
  PlayCircleIcon,
  VideoIcon,
} from "lucide-react";
import { cacheTag } from "next/dist/server/use-cache/cache-tag";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;
  const product = await getPublicProduct(productId);

  if (product == null) return notFound();

  const courseCount = product.courses.length;
  const lessonCount = sumArray(product.courses, (course) =>
    sumArray(course.courseSections, (s) => s.lessons.length),
  );

  return (
    <div className="container my-6 lg:my-10">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-10 items-start">
        {/* ─── Main column ─────────────────────────────── */}
        <div className="flex flex-col gap-10 min-w-0 order-2 lg:order-1">
          <div className="flex flex-col gap-4">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-balance">
              {product.name}
            </h1>
            <p className="text-lg text-muted-foreground text-pretty leading-relaxed">
              {product.description}
            </p>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground pt-1">
              <span className="flex items-center gap-1.5">
                <BookOpenIcon className="size-4" />
                {formatPlural(courseCount, {
                  singular: "course",
                  plural: "courses",
                })}
              </span>
              <span className="flex items-center gap-1.5">
                <PlayCircleIcon className="size-4" />
                {formatPlural(lessonCount, {
                  singular: "lesson",
                  plural: "lessons",
                })}
              </span>
            </div>

            {/* Instructor block — placeholder until real instructor profiles exist */}
            <Link
              href="/instructors/jonas"
              className="group mt-2 flex w-fit items-center gap-3 rounded-2xl border border-white/30 bg-white/40 px-4 py-3 backdrop-blur-md transition-colors hover:bg-white/60 dark:border-white/10 dark:bg-white/[0.03] dark:hover:bg-white/[0.07]"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-b from-primary to-primary/80 text-sm font-bold text-primary-foreground shadow-[inset_0_1px_0_0_rgba(255,255,255,0.3)]">
                TJ
              </div>
              <div className="leading-tight">
                <p className="text-xs text-muted-foreground">Created by</p>
                <p className="font-semibold group-hover:underline underline-offset-4">
                  Tutor Jonas
                </p>
              </div>
            </Link>
          </div>

          <div className="flex flex-col gap-4">
            <h2 className="text-2xl font-semibold tracking-tight">
              Course content
            </h2>
            <div className="flex flex-col gap-4">
              {product.courses.map((course) => (
                <Card
                  key={course.id}
                  className="overflow-hidden border-white/30 bg-white/50 backdrop-blur-md dark:border-white/10 dark:bg-white/[0.02]"
                >
                  <CardHeader>
                    <CardTitle className="text-xl">{course.name}</CardTitle>
                    <CardDescription>
                      {formatPlural(course.courseSections.length, {
                        plural: "sections",
                        singular: "section",
                      })}{" "}
                      •{" "}
                      {formatPlural(
                        sumArray(
                          course.courseSections,
                          (s) => s.lessons.length,
                        ),
                        {
                          plural: "lessons",
                          singular: "lesson",
                        },
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Accordion type="multiple" className="-mx-2">
                      {course.courseSections.map((section) => (
                        <AccordionItem
                          key={section.id}
                          value={section.id}
                          className="border-white/20 dark:border-white/10"
                        >
                          <AccordionTrigger className="flex gap-2 px-2 hover:no-underline">
                            <div className="flex flex-col flex-grow text-left">
                              <span className="text-base font-medium">
                                {section.name}
                              </span>
                              <span className="text-sm text-muted-foreground">
                                {formatPlural(section.lessons.length, {
                                  plural: "lessons",
                                  singular: "lesson",
                                })}
                              </span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="flex flex-col gap-1 px-2">
                            {section.lessons.map((lesson) => (
                              <div
                                key={lesson.id}
                                className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm text-muted-foreground"
                              >
                                <VideoIcon className="size-4 shrink-0" />
                                {lesson.status === "preview" ? (
                                  <Link
                                    href={`/courses/${course.id}/lessons/${lesson.id}`}
                                    className="text-foreground underline-offset-4 hover:underline"
                                  >
                                    {lesson.name}
                                  </Link>
                                ) : (
                                  <span className="text-foreground">
                                    {lesson.name}
                                  </span>
                                )}
                              </div>
                            ))}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* ─── Sticky purchase card ─────────────────────── */}
        <div className="order-1 lg:order-2 lg:sticky lg:top-24">
          <Card className="overflow-hidden border-white/30 bg-white/60 shadow-lg backdrop-blur-2xl backdrop-saturate-150 dark:border-white/10 dark:bg-black/40 py-0 gap-0">
            <div className="relative aspect-video w-full">
              <Image
                src={product.imageUrl}
                fill
                alt={product.name}
                className="object-cover"
                priority
              />
            </div>
            <div className="flex flex-col gap-4 p-6">
              <Suspense
                fallback={
                  <div className="text-2xl font-bold">
                    {formatPrice(product.priceInRupees)}
                  </div>
                }
              >
                <Price price={product.priceInRupees} />
              </Suspense>

              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <Suspense
                    fallback={<SkeletonButton className="h-12 w-full" />}
                  >
                    <PurchaseButton productId={product.id} />
                  </Suspense>
                </div>
                <Suspense
                  fallback={
                    <SkeletonButton className="h-12 w-12 shrink-0" />
                  }
                >
                  <WishlistToggle productId={product.id} />
                </Suspense>
              </div>

              <ul className="flex flex-col gap-2 border-t border-white/20 pt-4 text-sm text-muted-foreground dark:border-white/10">
                <li className="flex items-center gap-2">
                  <CheckCircle2Icon className="size-4 shrink-0 text-primary" />
                  Full lifetime access
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2Icon className="size-4 shrink-0 text-primary" />
                  Certificate of completion
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2Icon className="size-4 shrink-0 text-primary" />
                  Learn at your own pace
                </li>
              </ul>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

async function PurchaseButton({ productId }: { productId: string }) {
  const { userId } = await getCurrentUser();
  const alreadyOwnsProduct =
    userId != null && (await userOwnsProduct({ userId, productId }));

  if (alreadyOwnsProduct) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-white/30 bg-white/40 px-4 py-3 text-sm font-medium backdrop-blur-md dark:border-white/10 dark:bg-white/5">
        <CheckCircle2Icon className="size-4 text-primary" />
        You already own this course
      </div>
    );
  }

  return (
    <Button size="xl" className="w-full" asChild>
      <Link href={`/products/${productId}/purchase`}>Get Now</Link>
    </Button>
  );
}

// Signed-out users still get the button — clicking it surfaces the
// "sign in to save courses" message from the toggleWishlist action
// rather than hiding the affordance entirely.
async function WishlistToggle({ productId }: { productId: string }) {
  const { userId } = await getCurrentUser();
  const initialIsWishlisted =
    userId != null && (await isProductWishlisted(userId, productId));

  return (
    <WishlistButton
      productId={productId}
      initialIsWishlisted={initialIsWishlisted}
      className="h-12 w-12 shrink-0"
    />
  );
}

async function Price({ price }: { price: number }) {
  if (price === 0) {
    return (
      <div className="text-2xl font-bold tracking-tight">
        {formatPrice(price)}
      </div>
    );
  }

  return (
    <div className="flex items-baseline gap-2">
      <div className="text-base text-muted-foreground line-through">
        {formatPrice(price)}
      </div>
      <div className="text-2xl font-bold tracking-tight">
        {formatPrice(price)}
      </div>
    </div>
  );
}

async function getPublicProduct(id: string) {
  "use cache";
  cacheTag(getProductIdTag(id));

  const product = await db.query.ProductTable.findFirst({
    columns: {
      id: true,
      name: true,
      description: true,
      priceInRupees: true,
      imageUrl: true,
    },
    where: and(eq(ProductTable.id, id), wherePublicProducts),
    with: {
      courseProducts: {
        columns: {},
        with: {
          course: {
            columns: { id: true, name: true },
            with: {
              courseSections: {
                columns: { id: true, name: true },
                where: wherePublicCourseSections,
                orderBy: asc(CourseSectionTable.order),
                with: {
                  lessons: {
                    columns: { id: true, name: true, status: true },
                    where: wherePublicLessons,
                    orderBy: asc(LessonTable.order),
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (product == null) return product;

  cacheTag(
    ...product.courseProducts.flatMap((cp) => [
      getLessonCourseTag(cp.course.id),
      getCourseSectionCourseTag(cp.course.id),
      getCourseIdTag(cp.course.id),
    ]),
  );

  const { courseProducts, ...other } = product;

  return {
    ...other,
    courses: courseProducts.map((cp) => cp.course),
  };
}
