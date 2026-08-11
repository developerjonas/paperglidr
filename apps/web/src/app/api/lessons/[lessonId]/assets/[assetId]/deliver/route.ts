import { NextRequest, NextResponse } from "next/server";
import { db } from "@/drizzle/db";
import { LessonTable } from "@/drizzle/schema/lesson";
import { getCurrentUser } from "@/services/clerk";
import { UserCourseAccessTable } from "@/drizzle/schema";
import { and, eq } from "drizzle-orm";
import { getLessonAsset } from "@/features/lessons/db/lessonAssets";
import { getDownloadUrl } from "@/services/storage/r2";
// import { getBunnyStreamToken } from "@/services/bunny/streamToken";

const PDF_INLINE_EXPIRY_SECONDS = 60 * 15;
const PDF_DOWNLOAD_EXPIRY_SECONDS = 60 * 15;
// const BUNNY_TOKEN_EXPIRY_SECONDS = 60 * 60 * 4;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ lessonId: string; assetId: string }> }
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
      eq(UserCourseAccessTable.courseId, lesson.section.course.id)
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
      { status: 501 }
    );
  }

  if (asset.provider === "r2") {
    if (!asset.storageKey) {
      return NextResponse.json(
        { error: "Asset has no storage key" },
        { status: 500 }
      );
    }

    const url = await getDownloadUrl({
      storageKey: asset.storageKey,
      disposition: asset.downloadable ? "attachment" : "inline",
      fileName: asset.fileName ?? undefined,
      expirySeconds: asset.downloadable
        ? PDF_DOWNLOAD_EXPIRY_SECONDS
        : PDF_INLINE_EXPIRY_SECONDS,
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

  return NextResponse.json({ error: "Unsupported provider" }, { status: 500 });
}
