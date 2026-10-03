import { ImageResponse } from "next/og"
import { OG_COLORS, OG_CONTENT_TYPE, OG_SIZE, OgLogo, ogFonts } from "@/lib/og"
import { SITE_NAME } from "@/lib/site"

// The default link preview (Facebook, WhatsApp, Viber, X…) for every page
// that doesn't have its own, e.g. the home page.
export const alt = `${SITE_NAME}: learn from Nepal's best teachers, pay in rupees`
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background: OG_COLORS.primary,
          color: OG_COLORS.onPrimary,
          fontFamily: "Inter",
        }}
      >
        <OgLogo color={OG_COLORS.onPrimary} size={52} />
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ fontSize: 78, fontWeight: 700, lineHeight: 1.05, letterSpacing: "-0.03em" }}>
            Learn from Nepal&apos;s best teachers.
          </div>
          <div style={{ fontSize: 32, opacity: 0.9, lineHeight: 1.35 }}>
            Loksewa, entrance prep, languages, tech and more. Watch a free lesson first, pay in rupees.
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 26 }}>
          <div style={{ display: "flex", gap: 14 }}>
            {["eSewa", "Khalti", "Fonepay"].map((name) => (
              <div
                key={name}
                style={{
                  display: "flex",
                  padding: "8px 18px",
                  borderRadius: 999,
                  background: "rgba(255,255,255,0.16)",
                }}
              >
                {name}
              </div>
            ))}
          </div>
          <div style={{ display: "flex", fontWeight: 700 }}>chiyali.com</div>
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts: await ogFonts() },
  )
}
