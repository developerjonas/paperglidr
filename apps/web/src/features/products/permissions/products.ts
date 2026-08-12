import { db } from "@/drizzle/db";
import { CourseProductTable, ProductTable, UserRole } from "@/drizzle/schema";
import { eq } from "drizzle-orm";

export function canCreateProducts({ userId }: { userId: string | undefined }) {
  return userId != null;
}

// ProductTable has no authorId of its own — ownership is derived through
// the courses it bundles. Strictest interpretation: every linked course
// must belong to this user. This replaces a check that compared against
// product.authorId, a column that doesn't exist, meaning every non-admin
// update/delete was silently failing before this fix.
// ADJUST if bundles can span multiple authors and any-one-course should qualify.
async function userOwnsProductViaCourses(userId: string, productId: string) {
  const courseProducts = await db.query.CourseProductTable.findMany({
    where: eq(CourseProductTable.productId, productId),
    with: { course: { columns: { authorId: true } } },
  });
  return (
    courseProducts.length > 0 &&
    courseProducts.every((cp) => cp.course.authorId === userId)
  );
}

export async function canUpdateProducts(
  { userId, role }: { userId: string | undefined; role: UserRole | undefined },
  productId: string,
) {
  if (!userId || !productId) return false;
  if (role === "admin") return true;
  return userOwnsProductViaCourses(userId, productId);
}

export async function canDeleteProducts(
  { userId, role }: { userId: string | undefined; role: UserRole | undefined },
  productId: string,
) {
  if (!userId || !productId) return false;
  if (role === "admin") return true;
  return userOwnsProductViaCourses(userId, productId);
}

export const wherePublicProducts = eq(ProductTable.status, "public");
