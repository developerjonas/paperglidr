import type { MetadataRoute } from "next"
import { SITE_URL } from "@/lib/site"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Signed-in areas, APIs and checkout/result pages have nothing to index.
      disallow: [
        "/admin",
        "/api/",
        "/teach",
        "/account",
        "/purchases",
        "/certificates",
        "/courses",
        "/wishlist",
        "/support",
        "/sign-in",
        "/sign-up",
        "/products/*/purchase",
        "/products/purchase-failure",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
