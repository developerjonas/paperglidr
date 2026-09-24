"use server";
import { z } from "zod";
import {
  insertProduct,
  updateProduct as updateProductDb,
  deleteProduct as deleteProductDb,
} from "@/features/products/db/products";
import { redirect } from "next/navigation";
import {
  canCreateProducts,
  canDeleteProducts,
  canUpdateProducts,
  canBundleCourses,
} from "../permissions/products";
import { canPublishProduct } from "../lib/canPublishProduct";
import { productSchema } from "../schema/products";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/drizzle/db";
import {
  ProductTable,
  UserTable,
  type ProductStatus,
  type UserRole,
} from "@/drizzle/schema";
import { eq } from "drizzle-orm";

async function getCurrentUserContext() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) return { userId: undefined, role: undefined };
  const [dbUser] = await db
    .select({ role: UserTable.role })
    .from(UserTable)
    .where(eq(UserTable.id, session.user.id))
    .limit(1);
  return { userId: session.user.id, role: dbUser?.role };
}

export async function createProduct(unsafeData: z.infer<typeof productSchema>) {
  const { success, data } = productSchema.safeParse(unsafeData);
  const user = await getCurrentUserContext();

  if (!success || !canCreateProducts(user)) {
    return { error: true, message: "There was an error creating your product" };
  }

  if (!(await canBundleCourses(user, data.courseIds))) {
    return { error: true, message: "You can only include your own courses" };
  }

  if (data.status === "public") {
    const check = await canPublishProduct({
      description: data.description,
      courseIds: data.courseIds,
      authorId: user.userId!,
      role: user.role,
    });
    if (!check.canPublish) {
      return { error: true, message: check.reasons.join(" ") };
    }
  }

  await insertProduct({
    ...data,
    ...moderationFields({ requested: data.status, current: null, role: user.role }),
    authorId: user.userId!,
  });
  redirect("/teach/products");
}

/**
 * The stored status for what the creator asked for (task 18):
 * - "private" -> private
 * - "public" from a creator -> pending_review (an admin approves it at
 *   /admin/products); a product that is already public stays public when
 *   edited, and one already waiting stays waiting
 * - "public" from an admin -> public (no review of your own queue)
 */
function moderationFields({
  requested,
  current,
  role,
}: {
  requested: "private" | "public";
  current: { status: ProductStatus } | null;
  role: UserRole | undefined;
}): Partial<typeof ProductTable.$inferInsert> {
  if (requested === "private") return { status: "private" };
  if (role === "admin" || current?.status === "public") return { status: "public" };
  if (current?.status === "pending_review") return { status: "pending_review" };
  return { status: "pending_review", submittedForReviewAt: new Date(), reviewNote: null };
}

export async function updateProduct(
  id: string,
  unsafeData: z.infer<typeof productSchema>,
) {
  const { success, data } = productSchema.safeParse(unsafeData);
  const user = await getCurrentUserContext();

  if (!success || !(await canUpdateProducts(user, id))) {
    return { error: true, message: "There was an error updating your product" };
  }

  if (!(await canBundleCourses(user, data.courseIds))) {
    return { error: true, message: "You can only include your own courses" };
  }

  if (data.status === "public") {
    // The cap is the product's author's (an admin may be editing someone
    // else's product).
    const author = await db.query.ProductTable.findFirst({
      where: eq(ProductTable.id, id),
      columns: { authorId: true },
    });
    const check = await canPublishProduct({
      description: data.description,
      courseIds: data.courseIds,
      authorId: author?.authorId ?? user.userId!,
      role: user.role,
      excludeProductId: id,
    });
    if (!check.canPublish) {
      return { error: true, message: check.reasons.join(" ") };
    }
  }

  const current = await db.query.ProductTable.findFirst({
    where: eq(ProductTable.id, id),
    columns: { status: true },
  });
  await updateProductDb(id, {
    ...data,
    ...moderationFields({ requested: data.status, current: current ?? null, role: user.role }),
  });
  redirect("/teach/products");
}

export async function deleteProduct(id: string) {
  const user = await getCurrentUserContext();
  if (!(await canDeleteProducts(user, id))) {
    return { error: true, message: "Error deleting your product" };
  }
  await deleteProductDb(id);
  return { error: false, message: "Successfully deleted your product" };
}
