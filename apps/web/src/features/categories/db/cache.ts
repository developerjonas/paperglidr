import { getIdTag, getGlobalTag } from "@/lib/dataCache"
import { revalidateTag } from "next/cache"

export function getCategoryGlobalTag() {
  return getGlobalTag("categories")
}

export function getCategoryIdTag(id: string) {
  return getIdTag("categories", id)
}

export function revalidateCategoryCache(id?: string) {
  revalidateTag(getCategoryGlobalTag())
  if (id) {
    revalidateTag(getCategoryIdTag(id))
  }
}
