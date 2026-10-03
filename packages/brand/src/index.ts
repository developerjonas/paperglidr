/**
 * Chiyali's brand: the paper-plane mark, the wordmark and the colours.
 * The single source for the website's and the app's logo, and for every
 * icon and splash image (`pnpm --filter @repo/brand generate` renders them
 * into both apps). Change the mark or a colour here, then regenerate.
 */

export const BRAND_NAME = "Chiyali"

export const BRAND_COLORS = {
  /** The brand blue (web --primary, app `primary`). */
  primary: "#0055ff",
  /** The blue on dark backgrounds. */
  primaryDark: "#3380ff",
  /** Text and marks on the blue. */
  onPrimary: "#ffffff",
  /** The app's dark background (dark splash screen). */
  backgroundDark: "#111113",
} as const

/**
 * The paper plane, drawn as strokes on a 24×24 grid. The stroke width
 * scales with the size: 2 at 24px.
 */
export const PLANE_MARK = {
  viewBox: "0 0 24 24",
  paths: ["M2.5 11.5 21.5 3l-6 18-4.5-7.5z", "M11 13.5 21.5 3"],
  strokeWidth: 2,
  strokeLinejoin: "round",
  strokeLinecap: "round",
} as const

/** The wordmark is set in the UI font, bold italic, tightly tracked. */
export const WORDMARK = {
  text: BRAND_NAME,
  fontWeight: 700,
  fontStyle: "italic",
  /** Letter spacing as a fraction of the font size. */
  letterSpacingEm: -0.03,
} as const

/**
 * The mark as an SVG document. `markScale` is the plane's width as a
 * share of the canvas (the rest is padding); `background` fills the
 * whole square (omit for transparent).
 */
export function planeSvg({
  size,
  color,
  background,
  markScale = 1,
  strokeWidth = PLANE_MARK.strokeWidth,
  radius = 0,
}: {
  size: number
  color: string
  background?: string
  markScale?: number
  strokeWidth?: number
  /** Corner radius of the background square, as a share of the size. */
  radius?: number
}) {
  // Draw the 24-unit mark scaled into the middle of the canvas.
  const scale = (size * markScale) / 24
  const offset = (size - 24 * scale) / 2
  const paths = PLANE_MARK.paths.map((d) => `<path d="${d}"/>`).join("")
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">`,
    background ? `<rect width="${size}" height="${size}" rx="${size * radius}" fill="${background}"/>` : "",
    `<g transform="translate(${offset} ${offset}) scale(${scale})" fill="none" stroke="${color}" stroke-width="${strokeWidth}" stroke-linejoin="${PLANE_MARK.strokeLinejoin}" stroke-linecap="${PLANE_MARK.strokeLinecap}">${paths}</g>`,
    `</svg>`,
  ].join("")
}
