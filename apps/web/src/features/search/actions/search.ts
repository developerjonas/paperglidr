"use server";

import { searchQuerySchema, type SearchQuery } from "../schemas/search";
import { searchProducts } from "../db/search";

export type SearchActionResult =
  | { success: true; data: Awaited<ReturnType<typeof searchProducts>> }
  | { success: false; error: string };

export async function searchProductsAction(
  rawParams: Partial<SearchQuery>,
): Promise<SearchActionResult> {
  const { success, data, error } = searchQuerySchema.safeParse(rawParams);

  if (!success) {
    return {
      success: false,
      error: error.issues[0]?.message ?? "Invalid search parameters",
    };
  }

  try {
    const results = await searchProducts(data);
    return { success: true, data: results };
  } catch (err) {
    console.error("Search failed:", err);
    return { success: false, error: "Something went wrong while searching" };
  }
}
