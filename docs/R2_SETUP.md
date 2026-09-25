# Cloudflare R2 setup

Chiyali uses two R2 buckets:

| Bucket | Env var | Holds | Who can read it |
|---|---|---|---|
| Private (e.g. `chiyali-private`) | `R2_BUCKET_NAME` | Lesson videos, PDFs and attachments, invoice PDFs, and image uploads waiting to be checked (`image-uploads/`) | Nobody directly. The app hands out short-lived signed URLs after an access check |
| Public (e.g. `chiyali-images`) | `R2_PUBLIC_BUCKET_NAME` | Product thumbnails (`products/`) and instructor photos (`instructors/`) | Anyone, at `R2_PUBLIC_BASE_URL` (e.g. `https://images.chiyali.com`) |

## Why a separate public bucket, not a public folder in the private bucket

R2 makes a whole bucket public or keeps it private. A custom domain or `r2.dev` URL exposes every object in the bucket, and there is no setting that makes one prefix public. A "public prefix" would need a Worker in front of the bucket to hide everything else. With that setup, one mistake in the Worker would expose paid lesson videos. Two buckets keep the rule simple: nothing in the private bucket is ever reachable without a signed URL.

Images are never uploaded straight to the public bucket. The browser uploads to `image-uploads/` in the **private** bucket, and the server then checks the file:

- type: JPEG, PNG or WebP, by declared type **and** by file signature
- size: 5 MB or less

Only then does the server copy the file to the public bucket. Everything at the public domain has passed that check. That is why `NEXT_PUBLIC_IMAGE_HOSTS` only needs the one domain.

## Steps (Cloudflare dashboard)

1. **Private bucket.** R2 → Create bucket → e.g. `chiyali-private`, location Automatic. Leave **Public access** off. Do not connect a custom domain or enable the `r2.dev` URL.
2. **CORS on the private bucket.** Browsers upload to it directly with presigned PUT URLs.
   1. Bucket → Settings → CORS policy.
   2. Enter the policy below, with your real origins (add `http://localhost:3000` only for a dev bucket).
   3. `Content-Type` must be an allowed header, because it is part of the upload signature.
   ```json
   [
     {
       "AllowedOrigins": ["https://chiyali.com"],
       "AllowedMethods": ["PUT", "GET"],
       "AllowedHeaders": ["Content-Type"],
       "MaxAgeSeconds": 3600
     }
   ]
   ```
3. **Lifecycle rule on the private bucket.** This cleans up image uploads that were never confirmed, e.g. when the tab was closed mid-upload.
   1. Bucket → Settings → Object lifecycle rules → Add rule.
   2. Set the prefix to `image-uploads/`.
   3. Delete objects 1 day after upload.
4. **Public bucket.** Create a second bucket, e.g. `chiyali-images`. No CORS is needed, because browsers only GET from it through `<img>` and next/image.
5. **Custom domain for the public bucket.**
   1. Bucket → Settings → Custom Domains → Connect domain → `images.chiyali.com`. The zone must be on Cloudflare, and Cloudflare creates the DNS record.
   2. Leave the `r2.dev` public URL **disabled**. It is rate-limited and not meant for production.
6. **Optional hardening.**
   1. On the `chiyali.com` zone, go to Rules → Transform Rules → Modify Response Header.
   2. Match: hostname equals `images.chiyali.com`.
   3. Set the header `X-Content-Type-Options: nosniff`.
7. **API token.** R2 → Manage R2 API Tokens → Create API token.
   1. Permission: **Object Read & Write**.
   2. Scope it to **only these two buckets**.
   3. Copy the Access Key ID and Secret Access Key; the secret is shown once.
   4. The Account ID is on the R2 overview page.
8. **Env vars.** Set these in Vercel for Production (and in Preview with separate dev buckets):
   ```
   R2_ACCOUNT_ID=<account id>
   R2_ACCESS_KEY_ID=<token access key id>
   R2_SECRET_ACCESS_KEY=<token secret>
   R2_BUCKET_NAME=chiyali-private
   R2_PUBLIC_BUCKET_NAME=chiyali-images
   R2_PUBLIC_BASE_URL=https://images.chiyali.com
   NEXT_PUBLIC_IMAGE_HOSTS=images.chiyali.com
   ```
   `NEXT_PUBLIC_IMAGE_HOSTS` is inlined at build time, so redeploy after changing it.

## Check it works

1. As an instructor, upload a profile photo in onboarding. The preview appears, and the saved URL starts with `R2_PUBLIC_BASE_URL/instructors/`.
2. Rename a `.txt` file to `.png` and upload it. It is rejected with "That file isn't a valid image", and nothing new appears in the public bucket.
3. Upload a lesson MP4. It appears in the lesson editor without "upload not finished", and plays on the lesson page.
4. Open a lesson video's signed URL after it expires (15 minutes for documents; videos last up to 2× their length, capped at 3 hours). It returns 403 from R2.
5. The private bucket's `image-uploads/` prefix stays empty after successful uploads, because confirmed images are moved out.
