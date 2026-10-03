import { ImageResponse } from "next/og"
import { and, avg, count, eq } from "drizzle-orm"
import { db } from "@/drizzle/db"
import { CourseProductTable, CourseReviewTable } from "@/drizzle/schema"
import { getPublicProductDetail } from "@/features/products/db/products"
import { formatPrice } from "@/lib/formatters"
import { OG_COLORS, OG_CONTENT_TYPE, OG_SIZE, OgLogo, embeddableImage, ogFonts } from "@/lib/og"
import { SITE_NAME } from "@/lib/site"

// A course's link preview: thumbnail, title, teacher, rating and price.
// Public products only; anything else gets the plain brand card.
export const alt = `A course on ${SITE_NAME}`
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

const INK = "#18181b"
const MUTED = "#52525b"

export default async function CourseOpengraphImage({ params }: { params: Promise<{ productId: string }> }) {
  const { productId } = await params
  const product = /^[0-9a-f-]{36}$/i.test(productId) ? await getPublicProductDetail(productId) : null
  const fonts = await ogFonts()

  if (product == null) {
    return new ImageResponse(
      (
        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: OG_COLORS.primary, fontFamily: "Inter" }}>
          <OgLogo color={OG_COLORS.onPrimary} size={96} />
        </div>
      ),
      { ...OG_SIZE, fonts },
    )
  }

  const [[rating], thumbnail] = await Promise.all([
    db
      .select({ average: avg(CourseReviewTable.rating), reviews: count(CourseReviewTable.id) })
      .from(CourseProductTable)
      .innerJoin(
        CourseReviewTable,
        and(eq(CourseReviewTable.courseId, CourseProductTable.courseId), eq(CourseReviewTable.isHidden, false)),
      )
      .where(eq(CourseProductTable.productId, productId)),
    embeddableImage(product.imageUrl, 560),
  ])
  const reviews = Number(rating?.reviews ?? 0)
  const average = rating?.average == null ? null : Number(rating.average)
  const isFree = product.priceInRupees === 0
  const title = product.name.length > 90 ? `${product.name.slice(0, 87).trimEnd()}…` : product.name

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#ffffff",
          fontFamily: "Inter",
          color: INK,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", flex: 1, padding: "60px 56px 60px 72px" }}>
          <OgLogo color={OG_COLORS.primary} size={40} />
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ fontSize: title.length > 50 ? 50 : 60, fontWeight: 700, lineHeight: 1.08, letterSpacing: "-0.025em" }}>
              {title}
            </div>
            <div style={{ display: "flex", fontSize: 28, color: MUTED }}>
              by {product.authorName}
              {product.instructor?.isVerified ? <span style={{ color: OG_COLORS.primary, marginLeft: 10 }}>✓ verified</span> : null}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 24, fontSize: 30 }}>
            <div
              style={{
                display: "flex",
                padding: "10px 26px",
                borderRadius: 999,
                fontWeight: 700,
                color: OG_COLORS.onPrimary,
                background: isFree ? "#08875c" : OG_COLORS.primary,
              }}
            >
              {formatPrice(product.priceInRupees)}
            </div>
            {average != null && reviews > 0 ? (
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: MUTED }}>
                <span style={{ color: "#f59e0b" }}>★</span>
                <span style={{ color: INK, fontWeight: 700 }}>{average.toFixed(1)}</span>
                <span>({reviews} {reviews === 1 ? "review" : "reviews"})</span>
              </div>
            ) : (
              <div style={{ display: "flex", color: MUTED }}>Free preview lesson</div>
            )}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", width: 520, background: OG_COLORS.primary, padding: 40 }}>
          {thumbnail ? (
            <img src={thumbnail} alt="" width={440} height={248} style={{ borderRadius: 20, objectFit: "cover" }} />
          ) : (
            <div style={{ display: "flex", width: 440, justifyContent: "center" }}>
              <OgLogo color={OG_COLORS.onPrimary} size={64} />
            </div>
          )}
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts },
  )
}
