"use server";

import { z } from "zod";
import { db } from "@/drizzle/db";
import { CategoryTable } from "@/drizzle/schema";
import { revalidateCategoryCache } from "../db/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { categorySchema } from "../schemas/categories";

export async function createCategory(
  unsafeData: z.infer<typeof categorySchema>,
) {
  // Add permission check here if applicable (e.g., getCurrentUser())
  const { success, data } = categorySchema.safeParse(unsafeData);

  if (!success) {
    return { error: true, message: "Invalid form data" };
  }

  const [newCategory] = await db
    .insert(CategoryTable)
    .values({
      name: data.name,
      slug: data.slug,
    })
    .returning();

  if (!newCategory) {
    return { error: true, message: "Failed to create category" };
  }

  revalidateCategoryCache(newCategory.id);
  redirect("/admin/categories");
}

export async function deleteCategory(id: string) {
  // Add permission check here if applicable
  await db.delete(CategoryTable).where(eq(CategoryTable.id, id));
  revalidateCategoryCache(id);
  redirect("/admin/categories");
}
