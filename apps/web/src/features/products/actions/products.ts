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
} from "../permissions/products";
import { productSchema } from "../schema/products";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/drizzle/db";
import { UserTable } from "@/drizzle/schema";
import { eq } from "drizzle-orm";

async function getCurrentUserContext() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    return { userId: undefined, role: undefined };
  }

  // Fetch the role directly from the UserTable since it's not in the session type
  const [dbUser] = await db
    .select({ role: UserTable.role })
    .from(UserTable)
    .where(eq(UserTable.id, session.user.id))
    .limit(1);

  return {
    userId: session.user.id,
    role: dbUser?.role,
  };
}

export async function createProduct(unsafeData: z.infer<typeof productSchema>) {
  const { success, data } = productSchema.safeParse(unsafeData);
  const user = await getCurrentUserContext();

  if (!success || !canCreateProducts(user)) {
    return { error: true, message: "There was an error creating your product" };
  }

  await insertProduct({
    ...data,
    authorId: user.userId!,
  });

  redirect("/teach/products");
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

  await updateProductDb(id, data);

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
