import { db } from "@/drizzle/db"
import { ProductTable } from "@/drizzle/schema"
import { ProductCard } from "@/features/products/components/ProductCard"
import { getProductGlobalTag } from "@/features/products/db/cache"
import { wherePublicProducts } from "@/features/products/permissions/products"
import { asc } from "drizzle-orm"
import { unstable_cache } from "next/cache"

export default async function HomePage() {
  const products = await getPublicProducts()

  return (
    <div className="container my-6">
      <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4">
        {products.map(product => (
          <ProductCard key={product.id} {...product} />
        ))}
      </div>
    </div>
  )
}

const getPublicProducts = unstable_cache(
  async () => {
    return db.query.ProductTable.findMany({
      columns: {
        id: true,
        name: true,
        description: true,
        priceInDollars: true,
        imageUrl: true,
      },
      where: wherePublicProducts,
      orderBy: asc(ProductTable.name),
    })
  },
  ["public-products-list"], // Unique cache key for this query
  {
    tags: [getProductGlobalTag()], // Attaches your tag for revalidateTag()
  }
)
