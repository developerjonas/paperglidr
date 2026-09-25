// Hosts next/image may load remote images from. Shared by next.config.ts
// (images.remotePatterns) and the product/instructor form schemas, so a URL
// that next/image would refuse to render is rejected when it is saved
// instead of crashing the page that shows it.
//
// Built in: OAuth avatars (session user.image). Product and instructor
// images are uploaded to the public R2 bucket (features/images), so
// NEXT_PUBLIC_IMAGE_HOSTS only needs that bucket's custom domain, e.g.
// "images.chiyali.com". Everything in that bucket has been checked.
//
// Read from process.env directly, not data/env/client.ts: next.config.ts
// imports this before the app's env module exists, and the literal
// process.env.NEXT_PUBLIC_* reference is what Next inlines into the client.
const BUILT_IN_IMAGE_HOSTS = [
  "lh3.googleusercontent.com", // Google profile pictures
  "avatars.githubusercontent.com", // GitHub profile pictures
]

export const allowedImageHosts: readonly string[] = [
  ...BUILT_IN_IMAGE_HOSTS,
  ...(process.env.NEXT_PUBLIC_IMAGE_HOSTS ?? "")
    .split(",")
    .map(host => host.trim().toLowerCase())
    .filter(Boolean),
]

// Relative paths (served from this app) or https URLs on an allowed host.
export function isAllowedImageUrl(value: string) {
  if (value.startsWith("/") && !value.startsWith("//")) return true
  try {
    const url = new URL(value)
    return (
      url.protocol === "https:" &&
      allowedImageHosts.includes(url.hostname.toLowerCase())
    )
  } catch {
    return false
  }
}

export const imageHostErrorMessage = `Image must be an https URL on an allowed host: ${allowedImageHosts.join(", ")}`
