import { ActionButton } from "@/components/ActionButton";
import { SkeletonButton } from "@/components/Skeleton";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { db } from "@/drizzle/db";
import {
  CourseSectionTable,
  LessonStatus,
  LessonTable,
  UserLessonCompleteTable,
} from "@/drizzle/schema";
import { wherePublicCourseSections } from "@/features/courseSections/permissions/sections";
import { updateLessonCompleteStatus } from "@/features/lessons/actions/userLessonComplete";
import { YouTubeVideoPlayer } from "@/features/lessons/components/YouTubeVideoPlayer";
import { PdfLessonViewer } from "@/features/lessons/components/PdfLessonViewer";
import { AssetDownloadButton } from "@/features/lessons/components/AssetDownloadButton";
import { getLessonIdTag } from "@/features/lessons/db/cache/lessons";
import { getUserLessonCompleteIdTag } from "@/features/lessons/db/cache/userLessonComplete";
import {
  getPrimaryLessonAsset,
  getAttachmentLessonAssets,
} from "@/features/lessons/db/lessonAssets";
import {
  canViewLesson,
  wherePublicLessons,
} from "@/features/lessons/permissions/lessons";
import { canUpdateUserLessonCompleteStatus } from "@/features/lessons/permissions/userLessonComplete";
import { getCurrentUser } from "@/services/auth";
import { and, asc, desc, eq, gt, lt } from "drizzle-orm";
import { CheckSquare2Icon, LockIcon, XSquareIcon } from "lucide-react";
import { cacheTag } from "next/dist/server/use-cache/cache-tag";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ReactNode, Suspense } from "react";
import { QuestionThread } from "@/features/lessonQuestions/components/QuestionThread";
import { AskQuestionForm } from "@/features/lessonQuestions/components/AskQuestionForm";
import { getLessonCourseContext } from "@/features/lessonQuestions/lib/lessonAccess";
import {
  canAskLessonQuestion,
  canReplyToLessonQuestion,
  canViewLessonQuestions,
} from "@/features/lessonQuestions/permissions/lessonQuestions";
import { getQuestionsForLesson } from "@/features/lessonQuestions/db/lessonQuestions";
import { UserRole } from "@/drizzle/schema";
import { VideoLessonViewer } from "@/features/lessons/components/VideoLessonViewer";

export default async function LessonPage({
  params,
}: {
  params: Promise<{ courseId: string; lessonId: string }>;
}) {
  const { courseId, lessonId } = await params;
  const lesson = await getLesson(lessonId);

  if (lesson == null) return notFound();

  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <SuspenseBoundary lesson={lesson} courseId={courseId} />
    </Suspense>
  );
}

function LoadingSkeleton() {
  return null;
}

async function SuspenseBoundary({
  lesson,
  courseId,
}: {
  lesson: {
    id: string;
    name: string;
    description: string | null;
    status: LessonStatus;
    sectionId: string;
    order: number;
  };
  courseId: string;
}) {
  const { userId, role } = await getCurrentUser();
  const isLessonComplete =
    userId == null
      ? false
      : await getIsLessonComplete({ lessonId: lesson.id, userId });
  const canView = await canViewLesson({ role, userId }, lesson);
  const canUpdateCompletionStatus = await canUpdateUserLessonCompleteStatus(
    { userId },
    lesson.id,
  );

  const primaryAsset = canView
    ? ((await getPrimaryLessonAsset(lesson.id)) ?? null)
    : null;
  const attachments = canView ? await getAttachmentLessonAssets(lesson.id) : [];

  return (
    <div className="flex flex-col gap-6">
      {/* ---- Video/content card ---- */}
      <Card className="overflow-hidden border-white/30 bg-white/60 shadow-sm backdrop-blur-2xl backdrop-saturate-150 p-0 gap-0 dark:border-white/10 dark:bg-black/40">
        <div className="aspect-video">
          {canView ? (
            <LessonContentViewer
              lessonId={lesson.id}
              asset={primaryAsset}
              onFinishedVideo={
                !isLessonComplete && canUpdateCompletionStatus
                  ? updateLessonCompleteStatus.bind(null, lesson.id, true)
                  : undefined
              }
            />
          ) : (
            <div className="flex items-center justify-center bg-primary text-primary-foreground h-full w-full">
              <LockIcon className="size-16" />
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2 p-6">
          <div className="flex justify-between items-start gap-4">
            <h1 className="text-xl font-semibold">{lesson.name}</h1>
            <div className="flex gap-2 justify-end shrink-0">
              <Suspense fallback={<SkeletonButton />}>
                <ToLessonButton
                  lesson={lesson}
                  courseId={courseId}
                  lessonFunc={getPreviousLesson}
                >
                  Previous
                </ToLessonButton>
              </Suspense>
              {canUpdateCompletionStatus && (
                <ActionButton
                  action={updateLessonCompleteStatus.bind(
                    null,
                    lesson.id,
                    !isLessonComplete,
                  )}
                  variant="outline"
                >
                  <div className="flex gap-2 items-center">
                    {isLessonComplete ? (
                      <>
                        <CheckSquare2Icon /> Mark Incomplete
                      </>
                    ) : (
                      <>
                        <XSquareIcon /> Mark Complete
                      </>
                    )}
                  </div>
                </ActionButton>
              )}
              <Suspense fallback={<SkeletonButton />}>
                <ToLessonButton
                  lesson={lesson}
                  courseId={courseId}
                  lessonFunc={getNextLesson}
                >
                  Next
                </ToLessonButton>
              </Suspense>
            </div>
          </div>

          {canView ? (
            lesson.description && (
              <p className="text-sm text-muted-foreground">
                {lesson.description}
              </p>
            )
          ) : (
            <p className="text-sm text-muted-foreground">
              This lesson is locked. Please purchase the course to view it.
            </p>
          )}

          {canView && attachments.length > 0 && (
            <div className="flex flex-col gap-2 mt-2 rounded-[5px] border border-white/30 bg-white/40 p-3 dark:border-white/10 dark:bg-white/[0.03]">
              <h2 className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                Attachments
              </h2>
              <ul className="flex flex-col gap-1">
                {attachments.map((attachment) => (
                  <li key={attachment.id}>
                    <AssetDownloadButton
                      lessonId={lesson.id}
                      assetId={attachment.id}
                      fileName={attachment.fileName}
                      label={attachment.fileName ?? "Download attachment"}
                      variant="outline"
                    />
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </Card>

      {/* ---- Q&A card ---- */}
      <Card className="border-white/30 bg-white/60 shadow-sm backdrop-blur-2xl backdrop-saturate-150 p-6 gap-4 dark:border-white/10 dark:bg-black/40">
        <h2 className="text-lg font-semibold">Questions & Answers</h2>
        <Suspense
          fallback={
            <p className="text-sm text-muted-foreground">
              Loading questions...
            </p>
          }
        >
          <LessonQnA lessonId={lesson.id} userId={userId} role={role} />
        </Suspense>
      </Card>
    </div>
  );
}

function LessonContentViewer({
  lessonId,
  asset,
  onFinishedVideo,
}: {
  lessonId: string;
  asset: {
    id: string;
    type: string;
    externalId: string | null;
    downloadable: boolean;
    fileName: string | null;
  } | null;
  onFinishedVideo?: () => void;
}) {
  if (asset == null) {
    return (
      <div className="flex items-center justify-center h-full w-full bg-muted text-sm text-muted-foreground">
        No content has been uploaded for this lesson yet.
      </div>
    );
  }

  if (asset.type === "youtube" && asset.externalId) {
    return (
      <YouTubeVideoPlayer
        videoId={asset.externalId}
        onFinishedVideo={onFinishedVideo}
      />
    );
  }

  if (asset.type === "pdf") {
    return (
      <PdfLessonViewer
        lessonId={lessonId}
        assetId={asset.id}
        downloadable={asset.downloadable}
        fileName={asset.fileName}
      />
    );
  }

  if (asset.type === "video_file") {
    return (
      <VideoLessonViewer
        lessonId={lessonId}
        assetId={asset.id}
        onFinishedVideo={onFinishedVideo}
      />
    );
  }

  return (
    <div className="flex items-center justify-center h-full w-full bg-muted text-sm text-muted-foreground">
      Unsupported lesson content type.
    </div>
  );
}

async function ToLessonButton({
  children,
  courseId,
  lessonFunc,
  lesson,
}: {
  children: ReactNode;
  courseId: string;
  lesson: {
    id: string;
    sectionId: string;
    order: number;
  };
  lessonFunc: (lesson: {
    id: string;
    sectionId: string;
    order: number;
  }) => Promise<{ id: string } | undefined>;
}) {
  const toLesson = await lessonFunc(lesson);
  if (toLesson == null) return null;

  return (
    <Button variant="outline" asChild>
      <Link href={`/courses/${courseId}/lessons/${toLesson.id}`}>
        {children}
      </Link>
    </Button>
  );
}

async function getPreviousLesson(lesson: {
  id: string;
  sectionId: string;
  order: number;
}) {
  let previousLesson = await db.query.LessonTable.findFirst({
    where: and(
      lt(LessonTable.order, lesson.order),
      eq(LessonTable.sectionId, lesson.sectionId),
      wherePublicLessons,
    ),
    orderBy: desc(LessonTable.order),
    columns: { id: true },
  });

  if (previousLesson == null) {
    const section = await db.query.CourseSectionTable.findFirst({
      where: eq(CourseSectionTable.id, lesson.sectionId),
      columns: { order: true, courseId: true },
    });

    if (section == null) return;

    const previousSection = await db.query.CourseSectionTable.findFirst({
      where: and(
        lt(CourseSectionTable.order, section.order),
        eq(CourseSectionTable.courseId, section.courseId),
        wherePublicCourseSections,
      ),
      orderBy: desc(CourseSectionTable.order),
      columns: { id: true },
    });

    if (previousSection == null) return;

    previousLesson = await db.query.LessonTable.findFirst({
      where: and(
        eq(LessonTable.sectionId, previousSection.id),
        wherePublicLessons,
      ),
      orderBy: desc(LessonTable.order),
      columns: { id: true },
    });
  }

  return previousLesson;
}

async function getNextLesson(lesson: {
  id: string;
  sectionId: string;
  order: number;
}) {
  let nextLesson = await db.query.LessonTable.findFirst({
    where: and(
      gt(LessonTable.order, lesson.order),
      eq(LessonTable.sectionId, lesson.sectionId),
      wherePublicLessons,
    ),
    orderBy: asc(LessonTable.order),
    columns: { id: true },
  });

  if (nextLesson == null) {
    const section = await db.query.CourseSectionTable.findFirst({
      where: eq(CourseSectionTable.id, lesson.sectionId),
      columns: { order: true, courseId: true },
    });

    if (section == null) return;

    const nextSection = await db.query.CourseSectionTable.findFirst({
      where: and(
        gt(CourseSectionTable.order, section.order),
        eq(CourseSectionTable.courseId, section.courseId),
        wherePublicCourseSections,
      ),
      orderBy: asc(CourseSectionTable.order),
      columns: { id: true },
    });

    if (nextSection == null) return;

    nextLesson = await db.query.LessonTable.findFirst({
      where: and(eq(LessonTable.sectionId, nextSection.id), wherePublicLessons),
      orderBy: asc(LessonTable.order),
      columns: { id: true },
    });
  }

  return nextLesson;
}

async function getLesson(id: string) {
  "use cache";
  cacheTag(getLessonIdTag(id));

  return db.query.LessonTable.findFirst({
    columns: {
      id: true,
      name: true,
      description: true,
      status: true,
      sectionId: true,
      order: true,
    },
    where: and(eq(LessonTable.id, id), wherePublicLessons),
  });
}

async function getIsLessonComplete({
  userId,
  lessonId,
}: {
  userId: string;
  lessonId: string;
}) {
  "use cache";
  cacheTag(getUserLessonCompleteIdTag({ userId, lessonId }));

  const data = await db.query.UserLessonCompleteTable.findFirst({
    where: and(
      eq(UserLessonCompleteTable.userId, userId),
      eq(UserLessonCompleteTable.lessonId, lessonId),
    ),
  });

  return data != null;
}

async function LessonQnA({
  lessonId,
  userId,
  role,
}: {
  lessonId: string;
  userId: string | undefined;
  role: UserRole | undefined;
}) {
  if (!canViewLessonQuestions({ role, userId })) {
    return (
      <p className="text-sm text-muted-foreground">
        Sign in to see questions and answers for this lesson.
      </p>
    );
  }

  const context = await getLessonCourseContext(lessonId);
  if (context == null) return null;

  const [canAsk, canReply, questions] = await Promise.all([
    canAskLessonQuestion({ role, userId }, lessonId),
    canReplyToLessonQuestion({ role, userId }, lessonId),
    getQuestionsForLesson(lessonId),
  ]);

  return (
    <>
      {canAsk ? (
        <AskQuestionForm lessonId={lessonId} />
      ) : (
        <p className="text-sm text-muted-foreground">
          Purchase this course to ask a question.
        </p>
      )}
      <QuestionThread
        questions={questions}
        courseAuthorId={context.courseAuthorId}
        currentUserId={userId}
        canReply={canReply}
      />
    </>
  );
}
