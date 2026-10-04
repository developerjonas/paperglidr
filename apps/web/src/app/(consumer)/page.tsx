import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import {
  ArrowRight,
  BadgeCheck,
  BookOpen,
  PlayCircle,
  QrCode,
  Search,
  Smartphone,
  Star,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getHomeCatalog, type HomeCourse, type HomeInstructor } from "@/features/products/db/home";
import { FoundingBadge } from "@/features/instructors/components/FoundingBadge";
import { getPublicCategories } from "@/features/categories/db/categories";
import { categoryStyle } from "@/features/categories/lib/categoryStyle";
import { POLICY_TERMS } from "@/config/policyTerms";
import { formatPrice } from "@/lib/formatters";
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

// The learner's front door: find something to learn, see who teaches it,
// start with a free lesson. The pitch to creators lives at /creators.

const SHELF_SIZE = 12;


export default async function HomePage() {
  const [{ courses, instructors }, categories] = await Promise.all([
    getHomeCatalog(),
    getPublicCategories(),
  ]);

  // Pinned by an admin (/admin/products), most recently featured first.
  const featured = courses
    .filter((c) => c.featuredAt != null)
    .sort((a, b) => b.featuredAt!.getTime() - a.featuredAt!.getTime());
  const free = courses.filter((c) => c.priceInRupees === 0);
  const newest = courses; // already newest first
  const topRated = courses
    .filter((c) => c.reviewCount > 0 && c.avgRating != null)
    .sort((a, b) => b.avgRating! - a.avgRating! || b.reviewCount - a.reviewCount);
  const categoryShelves = categories
    .map((category) => ({
      category,
      items: courses.filter((c) => c.categoryId === category.id),
    }))
    .filter((shelf) => shelf.items.length > 0)
    .sort((a, b) => b.items.length - a.items.length)
    .slice(0, 4);
  const heroImages = courses.slice(0, 4);

  return (
    <div className="flex flex-col overflow-x-clip">
      {/* ---------- HERO: search first ---------- */}
      <section className="border-b">
        <div className="mx-auto grid w-full max-w-7xl items-center gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[1.1fr_1fr] lg:px-8 lg:py-20">
          <div>
            <h1 className="heading-display text-[2.4rem] leading-[1.05] sm:text-5xl lg:text-6xl">
              Learn from Nepal&apos;s
              <br className="hidden sm:block" /> best teachers.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground">
              Loksewa, entrance prep, languages, tech and more. Watch a free
              lesson first, pay in rupees with eSewa, Khalti or Fonepay, and
              learn on your phone.
            </p>

            <form action="/browse" method="get" role="search" className="mt-8 flex max-w-xl gap-2">
              <label htmlFor="home-search" className="sr-only">
                Search courses
              </label>
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="home-search"
                  name="q"
                  type="search"
                  placeholder="What do you want to learn?"
                  className="h-12 w-full rounded-full border bg-background pl-12 pr-4 text-base shadow-sm outline-none transition-shadow focus:border-primary/40 focus:ring-4 focus:ring-primary/15"
                />
              </div>
              <Button type="submit" size="lg" className="h-12 w-12 rounded-full px-0 sm:w-auto sm:px-6">
                <Search className="sm:hidden" />
                <span className="sr-only sm:not-sr-only">Search</span>
              </Button>
            </form>

            {categories.length > 0 && (
              <div className="mt-5 flex flex-wrap items-center gap-2">
                <span className="text-sm text-muted-foreground">Popular:</span>
                {categories.slice(0, 5).map((category) => (
                  <Link
                    key={category.id}
                    href={`/browse?category=${category.slug}`}
                    className="rounded-full border bg-background px-3 py-1 text-sm text-foreground/75 transition-colors hover:border-foreground/20 hover:text-foreground"
                  >
                    {category.name}
                  </Link>
                ))}
              </div>
            )}

            <dl className="mt-8 flex flex-wrap gap-x-8 gap-y-3 text-sm">
              <Stat value={courses.length} label={courses.length === 1 ? "course" : "courses"} />
              <Stat value={instructors.length} label={instructors.length === 1 ? "instructor" : "instructors"} />
              {free.length > 0 && <Stat value={free.length} label="free to start" />}
            </dl>
          </div>

          <HeroMosaic courses={heroImages} />
        </div>
      </section>

      {/* ---------- CATEGORIES ---------- */}
      {categories.length > 0 && (
        <Band>
          <ShelfHeader title="Explore by topic" href="/browse" linkLabel="All courses" />
          <div className="no-scrollbar -mx-4 mt-5 flex gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-3 sm:px-0 lg:grid-cols-6">
            {categories.map((category) => {
              const style = categoryStyle(category.slug);
              return (
                <Link
                  key={category.id}
                  href={`/browse?category=${category.slug}`}
                  className={cn(
                    "group flex w-36 shrink-0 flex-col gap-3 rounded-2xl border bg-card p-4 transition-all hover:-translate-y-0.5 hover:shadow-md sm:w-auto",
                    style.hover,
                  )}
                >
                  <span className={cn("flex h-10 w-10 items-center justify-center rounded-xl", style.tile)}>
                    <style.icon className="h-5 w-5" />
                  </span>
                  <span className="text-sm font-medium leading-snug">{category.name}</span>
                </Link>
              );
            })}
          </div>
        </Band>
      )}

      {courses.length === 0 ? (
        <Band>
          <div className="rounded-2xl border border-dashed bg-background p-12 text-center">
            <BookOpen className="mx-auto h-10 w-10 text-muted-foreground/60" />
            <h2 className="mt-4 text-lg font-semibold">The first courses are on their way</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Instructors are preparing their lessons. Check back soon, or start teaching yourself.
            </p>
            <Button asChild variant="outline" className="mt-5">
              <Link href="/creators">Teach on {SITE_NAME}</Link>
            </Button>
          </div>
        </Band>
      ) : (
        <>
          {featured.length > 0 && (
            <Shelf
              title="Featured courses"
              subtitle="Hand-picked by the Chiyali team."
              href="/browse"
              courses={featured}
            />
          )}
          {free.length > 0 && (
            <Shelf
              title="Start for free"
              subtitle="Whole courses you can take today, no payment needed."
              href="/browse"
              courses={free}
              muted
            />
          )}
          <Shelf
            title="New on Chiyali"
            subtitle="The latest courses from Nepali instructors."
            href="/browse"
            courses={newest}
            muted={free.length === 0}
          />
          {topRated.length > 0 && (
            <Shelf title="Top rated by students" href="/browse" courses={topRated} />
          )}
          {instructors.length > 0 && <InstructorShelf instructors={instructors} />}
          {categoryShelves.map(({ category, items }) => (
            <Shelf
              key={category.id}
              title={category.name}
              href={`/browse?category=${category.slug}`}
              courses={items}
            />
          ))}
        </>
      )}

      {/* ---------- WHY LEARN HERE ---------- */}
      <Band muted>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: PlayCircle, title: "Watch before you pay", body: "Every course has a free preview lesson, so you know the teacher before you buy." },
            { icon: Wallet, title: "Pay in rupees", body: "eSewa, Khalti or a Fonepay QR from your bank app. No foreign card." },
            { icon: Smartphone, title: "Made for your phone", body: "Learn on mobile data, pick up where you left off, and ask the teacher questions." },
            { icon: QrCode, title: "Certificates that check out", body: "Finish a course and get a certificate anyone can verify with its QR code." },
          ].map(({ icon: Icon, title, body }) => (
            <div key={title} className="flex gap-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </span>
              <div>
                <h3 className="font-semibold tracking-tight">{title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{body}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-8 text-sm text-muted-foreground">
          Changed your mind? Refunds within {POLICY_TERMS.refundWindowDays} days if you&apos;ve
          completed less than {POLICY_TERMS.refundCompletionThresholdPercent}% of the course.
        </p>
      </Band>

      {/* ---------- TEACH ---------- */}
      <Band>
        <div className="relative overflow-hidden rounded-3xl border bg-surface px-6 py-12 sm:px-12 sm:py-14">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_55%_80%_at_100%_0%,hsl(var(--primary)/0.14),transparent_70%)]"
          />
          <div className="relative grid items-center gap-8 lg:grid-cols-[1.4fr_1fr]">
            <div>
              <h2 className="heading-display text-3xl sm:text-4xl">Teach on {SITE_NAME}</h2>
              <p className="mt-3 max-w-xl text-lg text-muted-foreground">
                Turn what you know into a course. Free to publish, priced in
                rupees, and you keep {POLICY_TERMS.creatorSharePercent.referralLink}% of
                every sale through your own link.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
              <Button asChild size="lg">
                <Link href="/instructors/onboarding">Start teaching</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/creators">
                  How it works <ArrowRight />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </Band>
    </div>
  );
}

function Band({ muted = false, children }: { muted?: boolean; children: React.ReactNode }) {
  return (
    <section className={cn("py-10 sm:py-14", muted && "section-muted")}>
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">{children}</div>
    </section>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <dt className="sr-only">{label}</dt>
      <dd className="text-2xl font-semibold tracking-tight">{value}</dd>
      <span className="text-muted-foreground">{label}</span>
    </div>
  );
}

function ShelfHeader({
  title,
  subtitle,
  href,
  linkLabel = "See all",
}: {
  title: string;
  subtitle?: string;
  href: string;
  linkLabel?: string;
}) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight sm:text-[1.7rem]">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground sm:text-base">{subtitle}</p>}
      </div>
      <Link
        href={href}
        className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-primary hover:underline"
      >
        {linkLabel} <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}

/** A horizontally scrolling row of courses, like a YouTube shelf. */
function Shelf({
  title,
  subtitle,
  href,
  courses,
  muted = false,
}: {
  title: string;
  subtitle?: string;
  href: string;
  courses: HomeCourse[];
  muted?: boolean;
}) {
  return (
    <Band muted={muted}>
      <ShelfHeader title={title} subtitle={subtitle} href={href} />
      <ul className="no-scrollbar -mx-4 mt-5 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-4 px-4 pb-2 sm:mx-0 sm:scroll-px-0 sm:px-0">
        {courses.slice(0, SHELF_SIZE).map((course) => (
          <li key={course.id} className="w-[72%] shrink-0 snap-start sm:w-64 lg:w-[calc((100%-3rem)/4)]">
            <CourseTile course={course} />
          </li>
        ))}
      </ul>
    </Band>
  );
}

/** A course as a learner scans it: thumbnail, title, teacher, rating, price. */
function CourseTile({ course }: { course: HomeCourse }) {
  const isFree = course.priceInRupees === 0;
  return (
    <Link href={`/products/${course.id}`} className="group flex h-full flex-col">
      <div className="relative aspect-video overflow-hidden rounded-xl border bg-muted">
        <Image
          src={course.imageUrl}
          alt=""
          fill
          sizes="(min-width: 1024px) 300px, (min-width: 640px) 256px, 72vw"
          className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
        {course.lessonCount > 0 && (
          <span className="absolute bottom-2 right-2 rounded-md bg-black/75 px-1.5 py-0.5 text-xs font-medium text-white">
            {course.lessonCount} {course.lessonCount === 1 ? "lesson" : "lessons"}
          </span>
        )}
      </div>
      <h3 className="mt-3 line-clamp-2 font-semibold leading-snug tracking-tight group-hover:text-primary">
        {course.name}
      </h3>
      <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
        <span className="truncate">{course.instructorName}</span>
        {course.instructorVerified && (
          <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-primary" aria-label="Verified instructor" />
        )}
        {course.instructorFounding && <FoundingBadge compact className="ml-0.5 shrink-0" />}
      </p>
      <div className="mt-1.5 flex items-center gap-1.5 text-sm">
        {course.avgRating != null && course.reviewCount > 0 ? (
          <>
            <span className="font-semibold">{course.avgRating.toFixed(1)}</span>
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-hidden="true" />
            <span className="text-muted-foreground">({course.reviewCount})</span>
          </>
        ) : (
          <span className="rounded bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-primary">New</span>
        )}
      </div>
      <p className={cn("mt-1.5 font-semibold", isFree && "text-success")}>
        {formatPrice(course.priceInRupees)}
      </p>
    </Link>
  );
}

/** Instructors as a row of round avatars, like channels or pages to follow. */
function InstructorShelf({ instructors }: { instructors: HomeInstructor[] }) {
  return (
    <Band muted>
      <ShelfHeader
        title="Learn from these teachers"
        subtitle="Nepali instructors teaching on Chiyali."
        href="/browse"
        linkLabel="Browse courses"
      />
      <ul className="no-scrollbar -mx-4 mt-6 flex gap-6 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
        {instructors.map((instructor) => (
          <li key={instructor.handle} className="w-28 shrink-0 sm:w-32">
            <Link href={`/instructors/${instructor.handle}`} className="group flex flex-col items-center text-center">
              <span className="relative h-24 w-24 overflow-hidden rounded-full border-2 border-background ring-2 ring-primary/25 transition group-hover:ring-primary sm:h-28 sm:w-28">
                <Image
                  src={instructor.profileImageUrl}
                  alt=""
                  fill
                  sizes="112px"
                  className="object-cover"
                />
              </span>
              <span className="mt-3 line-clamp-2 text-sm font-semibold leading-tight">
                {instructor.name}
                {instructor.isVerified && (
                  <BadgeCheck
                    className="ml-1 inline h-3.5 w-3.5 align-[-2px] text-primary"
                    aria-label="Verified instructor"
                  />
                )}
              </span>
              <span className="mt-0.5 text-xs text-muted-foreground">
                {instructor.productCount} {instructor.productCount === 1 ? "course" : "courses"}
              </span>
              {instructor.isFounding && <FoundingBadge compact className="mt-1.5" />}
            </Link>
          </li>
        ))}
      </ul>
    </Band>
  );
}

/** Real course thumbnails as a tilted collage; a quiet placeholder until there are courses. */
function HeroMosaic({ courses }: { courses: HomeCourse[] }) {
  if (courses.length === 0) {
    return (
      <div aria-hidden="true" className="hidden aspect-[4/3] rounded-3xl border bg-surface lg:block">
        <div className="flex h-full items-center justify-center">
          <PlayCircle className="h-16 w-16 text-primary/40" />
        </div>
      </div>
    );
  }
  return (
    <div aria-hidden="true" className="relative mx-auto hidden w-full max-w-lg lg:block">
      <div className="grid grid-cols-2 gap-4">
        {courses.map((course, i) => (
          <div
            key={course.id}
            className={cn(
              "window overflow-hidden p-0",
              i % 2 === 1 && "translate-y-8",
              courses.length === 1 && "col-span-2",
            )}
          >
            <div className="relative aspect-video">
              <Image src={course.imageUrl} alt="" fill sizes="260px" className="object-cover" />
            </div>
            <div className="px-3 py-2.5">
              <p className="line-clamp-1 text-sm font-semibold">{course.name}</p>
              <p className="text-xs text-muted-foreground">
                {course.instructorName} · {formatPrice(course.priceInRupees)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
