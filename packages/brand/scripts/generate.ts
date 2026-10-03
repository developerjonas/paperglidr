/**
 * Renders every icon and splash image for the website and the app from
 * the mark and colours in src/index.ts. Run after changing either:
 *
 *   pnpm --filter @repo/brand generate
 *
 * The outputs are committed (the apps' builds don't run this).
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { dirname, join, relative } from "node:path"
import { fileURLToPath } from "node:url"
import sharp from "sharp"
import { BRAND_COLORS, planeSvg } from "../src/index"

const root = join(dirname(fileURLToPath(import.meta.url)), "../../..")
const web = join(root, "apps/web/src/app")
const mobile = join(root, "apps/mobile/assets/images")
const { primary, primaryDark, onPrimary, backgroundDark } = BRAND_COLORS

async function png(svg: string, out: string, size?: number) {
  mkdirSync(dirname(out), { recursive: true })
  let image = sharp(Buffer.from(svg))
  if (size) image = image.resize(size, size)
  await image.png({ compressionLevel: 9 }).toFile(out)
  console.log("  ", relative(root, out))
}

/** An .ico with PNG-encoded images (supported by every current browser). */
async function ico(svg: string, out: string, sizes: number[]) {
  const images = await Promise.all(sizes.map((size) => sharp(Buffer.from(svg)).resize(size, size).png().toBuffer()))
  const header = Buffer.alloc(6 + 16 * images.length)
  header.writeUInt16LE(0, 0) // reserved
  header.writeUInt16LE(1, 2) // type: icon
  header.writeUInt16LE(images.length, 4)
  let offset = header.length
  images.forEach((data, i) => {
    const entry = 6 + 16 * i
    header.writeUInt8(sizes[i]! >= 256 ? 0 : sizes[i]!, entry) // width
    header.writeUInt8(sizes[i]! >= 256 ? 0 : sizes[i]!, entry + 1) // height
    header.writeUInt16LE(1, entry + 4) // colour planes
    header.writeUInt16LE(32, entry + 6) // bits per pixel
    header.writeUInt32LE(data.length, entry + 8)
    header.writeUInt32LE(offset, entry + 12)
    offset += data.length
  })
  writeFileSync(out, Buffer.concat([header, ...images]))
  console.log("  ", relative(root, out))
}

function text(content: string, out: string) {
  writeFileSync(out, content)
  console.log("  ", relative(root, out))
}

// The app-icon look: a white plane on the brand blue.
const tile = (size: number, radius = 0) =>
  planeSvg({ size, color: onPrimary, background: primary, markScale: 0.56, strokeWidth: 1.9, radius })

async function main() {
  console.log("Website (apps/web/src/app — Next.js file conventions):")
  // Favicon: a rounded tile reads better than a bare plane at 16px.
  text(planeSvg({ size: 32, color: onPrimary, background: primary, markScale: 0.66, strokeWidth: 2.2, radius: 0.22 }), join(web, "icon.svg"))
  await ico(planeSvg({ size: 256, color: onPrimary, background: primary, markScale: 0.66, strokeWidth: 2.2, radius: 0.22 }), join(web, "favicon.ico"), [16, 32, 48])
  // Home-screen icon on iPhone/iPad: square and opaque; iOS rounds it.
  await png(tile(1024), join(web, "apple-icon.png"), 180)

  console.log("App (apps/mobile/assets/images):")
  // iOS and the store listing: 1024 square, opaque, no transparency.
  await png(tile(1024), join(mobile, "icon.png"))
  // Android adaptive icon: the plane inside the safe zone (the middle ~61%),
  // on a transparent layer; the blue comes from adaptiveIcon.backgroundColor.
  await png(planeSvg({ size: 1024, color: onPrimary, markScale: 0.42, strokeWidth: 1.9 }), join(mobile, "android-icon-foreground.png"))
  // Android 13+ themed icons use only the shape (alpha) of this layer.
  await png(planeSvg({ size: 1024, color: "#000000", markScale: 0.42, strokeWidth: 1.9 }), join(mobile, "android-icon-monochrome.png"))
  // Splash: the plane alone on transparent; app.json sets the background.
  await png(planeSvg({ size: 1024, color: onPrimary, markScale: 0.9, strokeWidth: 1.9 }), join(mobile, "splash-icon.png"))
  await png(planeSvg({ size: 1024, color: primaryDark, markScale: 0.9, strokeWidth: 1.9 }), join(mobile, "splash-icon-dark.png"))
  // The app's web build.
  await png(tile(1024, 0.22), join(mobile, "favicon.png"), 48)

  // The colours the images sit on live in app.json; keep them in step.
  const appJsonPath = join(root, "apps/mobile/app.json")
  const appJson = JSON.parse(readFileSync(appJsonPath, "utf8"))
  appJson.expo.android.adaptiveIcon.backgroundColor = primary
  const splash = appJson.expo.plugins.find((plugin: unknown) => Array.isArray(plugin) && plugin[0] === "expo-splash-screen")
  splash[1] = {
    ...splash[1],
    backgroundColor: primary,
    image: "./assets/images/splash-icon.png",
    dark: { image: "./assets/images/splash-icon-dark.png", backgroundColor: backgroundDark },
  }
  writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2) + "\n")
  console.log("  ", relative(root, appJsonPath), "(splash and adaptive-icon colours)")
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
