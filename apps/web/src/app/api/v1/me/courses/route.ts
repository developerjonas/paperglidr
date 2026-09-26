// apps/web/src/app/api/v1/me/courses/route.ts
import { apiJson, requireApiUser, v1Route } from "@/lib/api/v1"
import { getUserCourses } from "@/features/courses/db/courses"

// Courses the user has access to, A–Z, with published section/lesson counts
// and progress — the same list as the website's "My courses".
export const GET = v1Route("my courses", async () => {
  const gate = await requireApiUser()
  if (!gate.ok) return gate.response
  const courses = await getUserCourses(gate.user.userId)
  return apiJson(
    courses.map(course => ({
      id: course.id,
      name: course.name,
      description: course.description,
      totalSections: course.sectionsCount,
      totalLessons: course.lessonsCount,
      completedLessons: course.lessonsComplete,
    })),
  )
})
