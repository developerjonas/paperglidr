import { db } from "@/drizzle/db";
import { CourseTable, ProductTable, UserRole } from "@/drizzle/schema";
import { eq, inArray } from "drizzle-orm";

export function canCreateProducts({ userId }: { userId: string | undefined }) {
  return userId != null;
}

// A product belongs to its author (products.authorId, set on create).
// Ownership doesn't depend on the bundled courses, so an author can open
// and fix a product that has none; canBundleCourses separately limits
// which courses can be added.
async function userIsProductAuthor(userId: string, productId: string) {
  const product = await db.query.ProductTable.findFirst({
    where: eq(ProductTable.id, productId),
    columns: { authorId: true },
  });
  return product?.authorId === userId;
}

export async function canUpdateProducts(
  { userId, role }: { userId: string | undefined; role: UserRole | undefined },
  productId: string,
) {
  if (!userId || !productId) return false;
  if (role === "admin") return true;
  return userIsProductAuthor(userId, productId);
}

export async function canDeleteProducts(
  { userId, role }: { userId: string | undefined; role: UserRole | undefined },
  productId: string,
) {
  if (!userId || !productId) return false;
  if (role === "admin") return true;
  return userIsProductAuthor(userId, productId);
}

/**
 * A product may only bundle courses its creator authored (admins: any).
 * Without this, anyone could bundle another creator's paid course into
 * their own ₹0 product and enroll for free. Checked on create and update,
 * since courseIds comes from the form.
 */
export async function canBundleCourses(
  { userId, role }: { userId: string | undefined; role: UserRole | undefined },
  courseIds: string[],
) {
  if (!userId) return false;
  if (role === "admin") return true;
  const uniqueIds = [...new Set(courseIds)];
  if (uniqueIds.length === 0) return false;
  const courses = await db
    .select({ authorId: CourseTable.authorId })
    .from(CourseTable)
    .where(inArray(CourseTable.id, uniqueIds));
  return (
    courses.length === uniqueIds.length &&
    courses.every((course) => course.authorId === userId)
  );
}

export const wherePublicProducts = eq(ProductTable.status, "public");
