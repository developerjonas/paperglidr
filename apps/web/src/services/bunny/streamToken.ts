import crypto from "crypto";

const LIBRARY_ID = process.env.BUNNY_STREAM_LIBRARY_ID;
const TOKEN_AUTH_KEY = process.env.BUNNY_STREAM_TOKEN_AUTH_KEY; // Library > Security > Token Authentication Key — NOT your API access key

export function getBunnyEmbedUrl({
  videoId,
  expirySeconds = 60 * 60 * 4, // 4h, matches the generous window your R2 video delivery already uses
}: {
  videoId: string;
  expirySeconds?: number;
}) {
  if (!LIBRARY_ID || !TOKEN_AUTH_KEY) {
    throw new Error(
      "Missing BUNNY_STREAM_LIBRARY_ID or BUNNY_STREAM_TOKEN_AUTH_KEY env vars",
    );
  }

  const expires = Math.floor(Date.now() / 1000) + expirySeconds;
  const token = crypto
    .createHash("sha256")
    .update(`${TOKEN_AUTH_KEY}${videoId}${expires}`)
    .digest("hex");

  return {
    embedUrl: `https://iframe.mediadelivery.net/embed/${LIBRARY_ID}/${videoId}?token=${token}&expires=${expires}`,
    expires,
  };
}
