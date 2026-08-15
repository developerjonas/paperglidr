import { NextRequest, NextResponse } from "next/server";
import { db } from "@/drizzle/db";
import { LessonTable } from "@/drizzle/schema/lesson";
import { getCurrentUser } from "@/services/clerk";
import { UserCourseAccessTable } from "@/drizzle/schema";
import { and, eq } from "drizzle-orm";
import { getLessonAsset } from "@/features/lessons/db/lessonAssets";
import { getDownloadUrl } from "@/services/storage/r2";
import { getBunnyEmbedUrl } from "@/services/bunny/streamToken";
// import { getBunnyStreamToken } from "@/services/bunny/streamToken";

const PDF_INLINE_EXPIRY_SECONDS = 60 * 15;
const PDF_DOWNLOAD_EXPIRY_SECONDS = 60 * 15;
// Fallback for video rows uploaded before durationSeconds existed, or where
// client-side extraction failed — err generous rather than cutting playback
// short mid-lecture.
const DEFAULT_VIDEO_EXPIRY_SECONDS = 60 * 30;
// const BUNNY_TOKEN_EXPIRY_SECONDS = 60 * 60 * 4;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ lessonId: string; assetId: string }> },
) {
  const { lessonId, assetId } = await params;
  const user = await getCurrentUser();
  if (!user || !user.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = user.userId;
  const lesson = await db.query.LessonTable.findFirst({
    where: eq(LessonTable.id, lessonId),
    with: { section: { with: { course: true } } },
  });
  if (!lesson) {
    return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
  }
  const access = await db.query.UserCourseAccessTable.findFirst({
    where: and(
      eq(UserCourseAccessTable.userId, userId),
      eq(UserCourseAccessTable.courseId, lesson.section.course.id),
    ),
  });
  if (!access) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const asset = await getLessonAsset(assetId);
  if (!asset || asset.lessonId !== lessonId) {
    return NextResponse.json({ error: "Asset not found" }, { status: 404 });
  }
  // --- branch on provider + downloadable, per Section 4 table ---
  if (asset.provider === "bunny") {
    // Video pipeline not built yet (step 6 in the roadmap) — placeholder
    // response so the route shape is correct once getBunnyStreamToken exists.
    return NextResponse.json(
      { error: "Video delivery not yet implemented" },
      { status: 501 },
    );
  }
  if (asset.provider === "r2") {
    if (!asset.storageKey) {
      return NextResponse.json(
        { error: "Asset has no storage key" },
        { status: 500 },
      );
    }

    // Video gets an expiry scaled to its own length (2x, so a full
    // rewatch-from-start doesn't run out mid-playback); everything else
    // (PDFs, downloads) keeps the flat 15-minute window.
    const expirySeconds = asset.downloadable
      ? PDF_DOWNLOAD_EXPIRY_SECONDS
      : asset.type === "video_file"
        ? asset.durationSeconds != null
          ? asset.durationSeconds * 2
          : DEFAULT_VIDEO_EXPIRY_SECONDS
        : PDF_INLINE_EXPIRY_SECONDS;

    const url = await getDownloadUrl({
      storageKey: asset.storageKey,
      disposition: asset.downloadable ? "attachment" : "inline",
      fileName: asset.fileName ?? undefined,
      expirySeconds,
    });
    // NOTE: buyer-email stamping (Section 4 anti-leak deterrent) belongs
    // here — stamp/generate a per-buyer copy before signing — not yet implemented.
    return NextResponse.json({
      type: asset.downloadable ? "download" : "inline",
      url,
    });
  }
  if (asset.provider === "youtube") {
    return NextResponse.json({ type: "youtube", externalId: asset.externalId });
  }

  if (asset.provider === "bunny") {
    // ASSUMPTION: Bunny's video GUID is stored in asset.externalId, mirroring
    // how the youtube branch below uses externalId for its video ID. If your
    // lessonAsset schema stores it elsewhere (e.g. storageKey), swap this.
    if (!asset.externalId) {
      return NextResponse.json(
        { error: "Asset has no Bunny video ID" },
        { status: 500 },
      );
    }
    const { embedUrl } = getBunnyEmbedUrl({ videoId: asset.externalId });
    return NextResponse.json({ type: "bunny_embed", url: embedUrl });
  }

  return NextResponse.json({ error: "Unsupported provider" }, { status: 500 });
}
