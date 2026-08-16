import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/PageHeader"
import Link from "next/link"
import { CourseTable } from "@/features/courses/components/CourseTable"
import { cacheTag } from "next/dist/server/use-cache/cache-tag"
import { getCourseGlobalTag } from "@/features/courses/db/cache/courses"
import { db } from "@/drizzle/db"
import {
  CourseSectionTable,
  CourseTable as DbCourseTable,
  LessonTable,
  UserCourseAccessTable,
} from "@/drizzle/schema"
import { asc, countDistinct, eq } from "drizzle-orm"
import { getUserCourseAccessGlobalTag } from "@/features/courses/db/cache/userCourseAccess"
import { getCourseSectionGlobalTag } from "@/features/courseSections/db/cache"
import { getLessonGlobalTag } from "@/features/lessons/db/cache/lessons"
import { getCurrentUser } from "@/services/auth"

export default async function TeachCoursesPage() {
  const { userId, redirectToSignIn } = await getCurrentUser()
  if (userId == null) return redirectToSignIn()

  const courses = await getMyCourses(userId)

  return (
    <div className="container my-6">
      <PageHeader title="My Courses">
        <Button asChild>
          <Link href="/teach/courses/new">New Course</Link>
        </Button>
      </PageHeader>
      <CourseTable courses={courses} />
    </div>
  )
}

async function getMyCourses(authorId: string) {
  "use cache"
  cacheTag(
    getCourseGlobalTag(),
    getUserCourseAccessGlobalTag(),
    getCourseSectionGlobalTag(),
    getLessonGlobalTag()
  )
  return db
    .select({
      id: DbCourseTable.id,
      name: DbCourseTable.name,
      sectionsCount: countDistinct(CourseSectionTable),
      lessonsCount: countDistinct(LessonTable),
      studentsCount: countDistinct(UserCourseAccessTable),
    })
    .from(DbCourseTable)
    .leftJoin(
      CourseSectionTable,
      eq(CourseSectionTable.courseId, DbCourseTable.id)
    )
    .leftJoin(LessonTable, eq(LessonTable.sectionId, CourseSectionTable.id))
    .leftJoin(
      UserCourseAccessTable,
      eq(UserCourseAccessTable.courseId, DbCourseTable.id)
    )
    .where(eq(DbCourseTable.authorId, authorId))
    .orderBy(asc(DbCourseTable.name))
    .groupBy(DbCourseTable.id)
}
