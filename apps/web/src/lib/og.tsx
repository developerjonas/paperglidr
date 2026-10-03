import "server-only"
import { readFile } from "node:fs/promises"
import { join } from "node:path"
import sharp from "sharp"
import { BRAND_COLORS, BRAND_NAME, PLANE_MARK, WORDMARK } from "@repo/brand"
import { SITE_URL } from "@/lib/site"

// Shared pieces of the link-preview images (app/**/opengraph-image.tsx):
// the size, Inter from @repo/brand, the logo, and remote images made safe
// to embed.

export const OG_SIZE = { width: 1200, height: 630 }
export const OG_CONTENT_TYPE = "image/png"

// The fonts live in packages/brand/fonts (Inter, OFL). next.config.ts
// includes them in the server bundle (outputFileTracingIncludes).
const FONT_DIR = join(process.cwd(), "../../packages/brand/fonts")

export async function ogFonts() {
  const [regular, bold, boldItalic] = await Promise.all(
    ["Inter-400.ttf", "Inter-700.ttf", "Inter-700Italic.ttf"].map((file) => readFile(join(FONT_DIR, file))),
  )
  return [
    { name: "Inter", data: regular!, weight: 400 as const, style: "normal" as const },
    { name: "Inter", data: bold!, weight: 700 as const, style: "normal" as const },
    { name: "Inter", data: boldItalic!, weight: 700 as const, style: "italic" as const },
  ]
}

/** The paper plane + wordmark, as on the site header. */
export function OgLogo({ color, size = 44 }: { color: string; size?: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: size * 0.3 }}>
      <svg width={size} height={size} viewBox={PLANE_MARK.viewBox} fill="none">
        {PLANE_MARK.paths.map((d) => (
          <path
            key={d}
            d={d}
            stroke={color}
            strokeWidth={PLANE_MARK.strokeWidth}
            strokeLinejoin={PLANE_MARK.strokeLinejoin}
            strokeLinecap={PLANE_MARK.strokeLinecap}
          />
        ))}
      </svg>
      <span
        style={{
          color,
          fontSize: size * 0.82,
          fontWeight: WORDMARK.fontWeight,
          fontStyle: WORDMARK.fontStyle,
          letterSpacing: `${WORDMARK.letterSpacingEm}em`,
        }}
      >
        {BRAND_NAME}
      </span>
    </div>
  )
}

/**
 * A remote image (e.g. a course thumbnail) as a JPEG data URL the image
 * renderer can embed, resized to `width`. Null if it can't be fetched or
 * read in time — the preview then renders without it rather than failing.
 */
export async function embeddableImage(src: string, width: number): Promise<string | null> {
  try {
    const url = new URL(src, SITE_URL)
    const response = await fetch(url, { signal: AbortSignal.timeout(4_000) })
    if (!response.ok) return null
    const input = Buffer.from(await response.arrayBuffer())
    const jpeg = await sharp(input).resize({ width, withoutEnlargement: false }).jpeg({ quality: 82 }).toBuffer()
    return `data:image/jpeg;base64,${jpeg.toString("base64")}`
  } catch {
    return null
  }
}

export const OG_COLORS = BRAND_COLORS
