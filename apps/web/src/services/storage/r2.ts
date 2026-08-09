import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";

// R2 is S3-compatible — reuse the AWS SDK, just point it at the R2 endpoint.
const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.R2_BUCKET!;

/**
 * Build a storage key that's predictable enough to reason about but not
 * guessable — used for both PDFs today and raw video ingestion later.
 */
export function buildStorageKey(opts: {
  courseId: string;
  lessonId: string;
  fileName: string;
}) {
  const ext = opts.fileName.split(".").pop() ?? "bin";
  return `courses/${opts.courseId}/lessons/${opts.lessonId}/${randomUUID()}.${ext}`;
}

/**
 * Presigned PUT for direct-to-R2 upload from the browser. Client never
 * touches our server with the file bytes — we just hand back a URL.
 */
export async function getUploadUrl(opts: {
  storageKey: string;
  mimeType: string;
  expirySeconds?: number;
}) {
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: opts.storageKey,
    ContentType: opts.mimeType,
  });

  return getSignedUrl(r2, command, {
    expiresIn: opts.expirySeconds ?? 300, // 5 min to start the upload
  });
}

/**
 * Presigned GET for delivery. `disposition` controls whether the browser
 * opens it inline (PDF.js viewer) or triggers a download prompt.
 */
export async function getDownloadUrl(opts: {
  storageKey: string;
  disposition: "inline" | "attachment";
  fileName?: string;
  expirySeconds: number;
}) {
  const dispositionHeader =
    opts.disposition === "attachment" && opts.fileName
      ? `attachment; filename="${opts.fileName}"`
      : opts.disposition;

  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: opts.storageKey,
    ResponseContentDisposition: dispositionHeader,
  });

  return getSignedUrl(r2, command, {
    expiresIn: opts.expirySeconds,
  });
}
