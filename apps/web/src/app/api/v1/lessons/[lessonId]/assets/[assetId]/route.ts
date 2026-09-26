import type { NextRequest } from "next/server"
import { apiError, v1Route } from "@/lib/api/v1"
import { GET as deliverAsset } from "@/app/api/lessons/[lessonId]/assets/[assetId]/deliver/route"

/**
 * A short-lived URL for one lesson asset — the web player's delivery route,
 * with errors in the v1 `{ message }` shape. Success is one of:
 *   { type: "inline" | "download", url }   signed file URL (R2)
 *   { type: "bunny_embed", url }           Bunny Stream player URL
 *   { type: "youtube" | "vimeo", externalId, startSeconds, embedUrl }
 *                                          free-tier lessons only
 * Ask again when a URL expires; never cache it.
 */
export const GET = v1Route<{ lessonId: string; assetId: string }>("lesson asset", async (req, context) => {
  const response = await deliverAsset(req as NextRequest, context)
  if (response.ok) return response
  const body = (await response.json().catch(() => null)) as { error?: string } | null
  return apiError(response.status, body?.error ?? "This file couldn't be loaded")
})
