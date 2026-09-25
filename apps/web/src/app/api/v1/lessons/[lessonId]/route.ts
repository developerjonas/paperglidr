// apps/web/src/app/api/v1/lessons/[lessonId]/route.ts
import { and, eq } from "drizzle-orm"
import { apiError, apiJson, getApiViewer, isUuid, v1Route } from "@/lib/api/v1"
import { mobileApiDisabled } from "@/lib/mobileApi"
import { db } from "@/drizzle/db"
import { UserLessonCompleteTable } from "@/drizzle/schema"
import { getLessonForViewer } from "@/features/lessons/db/lessons"
import { canAccessLessonContent } from "@/features/lessons/permissions/lessons"

/**
 * One lesson for the player. Preview lessons open for anyone (signed out
 * too); the rest need access to the course. Uses the same uncached check
 * as file delivery, so a refund removes access immediately. Each asset's
 * playable URL: GET /api/v1/lessons/[lessonId]/assets/[assetId].
 */
export const GET = v1Route<{ lessonId: string }>("lesson", async (_req, { params }) => {
  const disabled = mobileApiDisabled()
  if (disabled) return disabled

  const { lessonId } = await params
  if (!isUuid(lessonId)) return apiError(404, "Lesson not found")

  const viewer = await getApiViewer()
  const access = await canAccessLessonContent(viewer, lessonId)
  if (!access.allowed) {
    return access.reason === "not_found"
      ? apiError(404, "Lesson not found")
      : access.reason === "sign_in_required"
        ? apiError(401, "Sign in to watch this lesson")
        : apiError(403, "Buy this course to watch this lesson")
  }

  const lesson = await getLessonForViewer(lessonId)
  if (!lesson) return apiError(404, "Lesson not found")

  const completed =
    viewer.userId == null
      ? null
      : await db.query.UserLessonCompleteTable.findFirst({
          where: and(
            eq(UserLessonCompleteTable.userId, viewer.userId),
            eq(UserLessonCompleteTable.lessonId, lessonId),
          ),
          columns: { lessonId: true },
        })

  return apiJson({
    id: lesson.id,
    name: lesson.name,
    description: lesson.description,
    isPreview: lesson.status === "preview",
    sectionId: lesson.sectionId,
    courseId: access.lesson.courseId,
    isComplete: completed != null,
    assets: lesson.assets.map(asset => ({
      id: asset.id,
      type: asset.type,
      provider: asset.provider,
      role: asset.role,
      fileName: asset.fileName,
      mimeType: asset.mimeType,
      fileSizeBytes: asset.fileSizeBytes,
      downloadable: asset.downloadable,
      durationSeconds: asset.durationSeconds,
      order: asset.order,
      url: `/api/v1/lessons/${lesson.id}/assets/${asset.id}`,
    })),
  })
})
