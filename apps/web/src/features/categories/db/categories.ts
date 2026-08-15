import { db } from "@/drizzle/db"
import { CategoryTable } from "@/drizzle/schema"
import { cacheTag } from "next/dist/server/use-cache/cache-tag"
import { getCategoryGlobalTag } from "./cache"

export async function getPublicCategories() {
  "use cache"
  cacheTag(getCategoryGlobalTag())

  return db.select().from(CategoryTable).orderBy(CategoryTable.name)
}
