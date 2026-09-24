import { eq } from "drizzle-orm"
import { describe, expect, it } from "vitest"
import { db } from "@/drizzle/db"
import { ProductTable } from "@/drizzle/schema"
import { createProduct, createUser } from "@/test/fixtures"
import { canDeleteProducts, canUpdateProducts } from "./products"

// Ownership is products.authorId — not derived from the bundled courses.

describe("product ownership", () => {
  it("the author can edit and delete a product with no courses; others can't", async () => {
    const author = await createUser("author")
    const other = await createUser("other")
    const [empty] = await db
      .insert(ProductTable)
      .values({ name: "empty", description: "d", imageUrl: "/x.png", priceInRupees: 1, status: "private", authorId: author.id })
      .returning()

    expect(await canUpdateProducts({ userId: author.id, role: "user" }, empty!.id)).toBe(true)
    expect(await canDeleteProducts({ userId: author.id, role: "user" }, empty!.id)).toBe(true)
    expect(await canUpdateProducts({ userId: other.id, role: "user" }, empty!.id)).toBe(false)
    expect(await canDeleteProducts({ userId: other.id, role: "user" }, empty!.id)).toBe(false)
    expect(await canUpdateProducts({ userId: other.id, role: "admin" }, empty!.id)).toBe(true)
  })

  it("owning the courses in a product doesn't make you its owner", async () => {
    const { product, creator } = await createProduct()
    const newAuthor = await createUser("new-author")
    await db.update(ProductTable).set({ authorId: newAuthor.id }).where(eq(ProductTable.id, product.id))
    expect(await canUpdateProducts({ userId: newAuthor.id, role: "user" }, product.id)).toBe(true)
    expect(await canUpdateProducts({ userId: creator.id, role: "user" }, product.id)).toBe(false)
  })
})
