"use server"

import { randomUUID } from "crypto"
import { z } from "zod"
import { getCurrentUser } from "@/services/auth"
import {
  copyToPublicBucket,
  deleteObject,
  getUploadUrl,
  headObject,
  readObjectPrefix,
} from "@/services/storage/r2"
import { UserFacingError, actionError } from "@/lib/safeError"
import { SIGNATURE_BYTES } from "@/features/lessons/lib/uploadRules"
import {
  IMAGE_MAX_BYTES,
  IMAGE_RULES_TEXT,
  IMAGE_TYPES,
  imageUploadPurposes,
  isImageMimeType,
  type ImageUploadPurpose,
} from "../lib/imageUploadRules"

// Flow: the browser PUTs to a staging key in the PRIVATE bucket, then
// confirmImageUpload checks the object and copies it to the public bucket.
// Nothing reaches the public domain unchecked. Staged objects are deleted
// after the copy; an R2 lifecycle rule on "image-uploads/" cleans up
// uploads that were never confirmed (see docs/R2_SETUP.md).
const STAGING_PREFIX = "image-uploads"

function stagingPrefix(purpose: ImageUploadPurpose, userId: string) {
  return `${STAGING_PREFIX}/${purpose}/${userId}/`
}

const requestSchema = z.object({
  purpose: z.enum(imageUploadPurposes),
  mimeType: z.string(),
  fileSizeBytes: z.number().int().positive(),
})

export async function requestImageUploadUrl(input: z.infer<typeof requestSchema>) {
  try {
    const { userId } = await getCurrentUser()
    if (userId == null) throw new UserFacingError("Sign in to upload images.")

    const parsed = requestSchema.safeParse(input)
    if (!parsed.success) throw new UserFacingError("Invalid upload.")
    const { purpose, mimeType, fileSizeBytes } = parsed.data

    if (!isImageMimeType(mimeType)) {
      throw new UserFacingError(`Images must be ${IMAGE_RULES_TEXT}`)
    }
    if (fileSizeBytes > IMAGE_MAX_BYTES) {
      throw new UserFacingError(`Images must be ${IMAGE_RULES_TEXT}`)
    }

    const stagingKey = `${stagingPrefix(purpose, userId)}${randomUUID()}.${IMAGE_TYPES[mimeType].extension}`
    const uploadUrl = await getUploadUrl({
      storageKey: stagingKey,
      mimeType,
      contentLength: fileSizeBytes,
    })
    return { error: false as const, uploadUrl, stagingKey }
  } catch (error) {
    return actionError(error, "requestImageUploadUrl", "Couldn't start the upload.")
  }
}

const confirmSchema = z.object({
  purpose: z.enum(imageUploadPurposes),
  stagingKey: z.string(),
})

export async function confirmImageUpload(input: z.infer<typeof confirmSchema>) {
  try {
    const { userId } = await getCurrentUser()
    if (userId == null) throw new UserFacingError("Sign in to upload images.")

    const parsed = confirmSchema.safeParse(input)
    if (!parsed.success) throw new UserFacingError("Invalid upload.")
    const { purpose, stagingKey } = parsed.data

    // Only the caller's own staged uploads, in exactly the shape
    // requestImageUploadUrl produces.
    const prefix = stagingPrefix(purpose, userId)
    const fileName = stagingKey.startsWith(prefix) ? stagingKey.slice(prefix.length) : ""
    if (!/^[0-9a-f-]{36}\.(jpg|png|webp)$/.test(fileName)) {
      throw new UserFacingError("Upload not found.")
    }

    const head = await headObject(stagingKey)
    if (head == null || head.contentLength == null) {
      throw new UserFacingError("The upload didn't reach storage. Please try again.")
    }

    const contentType = head.contentType ?? ""
    const problem =
      head.contentLength > IMAGE_MAX_BYTES || !isImageMimeType(contentType)
        ? `Images must be ${IMAGE_RULES_TEXT}`
        : !IMAGE_TYPES[contentType].looksLike(await readObjectPrefix(stagingKey, SIGNATURE_BYTES))
          ? `That file isn't a valid image. Images must be ${IMAGE_RULES_TEXT}`
          : null
    if (problem != null || !isImageMimeType(contentType)) {
      await deleteObject(stagingKey)
      throw new UserFacingError(problem ?? `Images must be ${IMAGE_RULES_TEXT}`)
    }

    const url = await copyToPublicBucket({
      sourceKey: stagingKey,
      destinationKey: `${purpose}s/${fileName.replace(/^[^.]+/, randomUUID())}`,
      contentType,
    })
    await deleteObject(stagingKey)

    return { error: false as const, url }
  } catch (error) {
    return actionError(error, "confirmImageUpload", "Couldn't finish the upload.")
  }
}
