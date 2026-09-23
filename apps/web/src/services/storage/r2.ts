import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  DeleteObjectCommand,
  CopyObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";
import { env } from "@/data/env/server";

// R2 is S3-compatible — reuse the AWS SDK, just point it at the R2 endpoint.
const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
  },
});

const BUCKET = env.R2_BUCKET_NAME;
// Everything in the public bucket is readable by anyone at
// R2_PUBLIC_BASE_URL. Only copyToPublicBucket writes to it, and only after
// the file has been checked in the private bucket.
const PUBLIC_BUCKET = env.R2_PUBLIC_BUCKET_NAME;

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
  // Signed into the URL: R2 rejects an upload whose Content-Length differs,
  // so the browser can only send the file size it declared.
  contentLength: number;
  expirySeconds?: number;
}) {
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: opts.storageKey,
    ContentType: opts.mimeType,
    ContentLength: opts.contentLength,
  });

  return getSignedUrl(r2, command, {
    expiresIn: opts.expirySeconds ?? 300, // 5 min to start the upload
    signableHeaders: new Set(["content-type", "content-length"]),
  });
}

/** Size and type as stored, or null if the object doesn't exist. */
export async function headObject(storageKey: string) {
  try {
    const head = await r2.send(new HeadObjectCommand({ Bucket: BUCKET, Key: storageKey }));
    return { contentLength: head.ContentLength ?? null, contentType: head.ContentType ?? null };
  } catch (error) {
    const status = (error as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode;
    if (status === 404) return null;
    throw error;
  }
}

/** The first `length` bytes of an object — for file-signature checks. */
export async function readObjectPrefix(storageKey: string, length = 16) {
  const result = await r2.send(
    new GetObjectCommand({ Bucket: BUCKET, Key: storageKey, Range: `bytes=0-${length - 1}` }),
  );
  const bytes = await result.Body?.transformToByteArray();
  return bytes ? Buffer.from(bytes) : Buffer.alloc(0);
}

export async function deleteObject(storageKey: string) {
  await r2.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: storageKey }));
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

/**
 * Server-side direct upload — for files generated in-process (e.g. invoice
 * PDFs) where there's no browser client to hand a presigned URL to. Unlike
 * getUploadUrl, this actually sends the bytes now, using the credentials
 * this module already holds.
 */
export async function putObject(opts: {
  storageKey: string
  body: Buffer
  contentType: string
}) {
  await r2.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: opts.storageKey,
      Body: opts.body,
      ContentType: opts.contentType,
    })
  )
  return opts.storageKey
}

/**
 * Copies a checked object from the private bucket to the public one and
 * returns its public URL. Server-side copy — the bytes never pass through
 * this app.
 */
export async function copyToPublicBucket(opts: {
  sourceKey: string
  destinationKey: string
  contentType: string
}) {
  await r2.send(
    new CopyObjectCommand({
      Bucket: PUBLIC_BUCKET,
      Key: opts.destinationKey,
      CopySource: `${BUCKET}/${opts.sourceKey}`,
      ContentType: opts.contentType,
      MetadataDirective: "REPLACE",
      CacheControl: "public, max-age=31536000, immutable",
    })
  )
  return `${env.R2_PUBLIC_BASE_URL}/${opts.destinationKey}`
}
