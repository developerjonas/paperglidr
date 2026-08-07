import Link from "next/link"
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

export function InstructorCourseCard({
  course,
}: {
  course: { id: string; name: string; description: string }
}) {
  return (
    <Link href={`/courses/${course.id}`}>
      <Card className="hover:border-primary transition-colors">
        <CardHeader>
          <CardTitle>{course.name}</CardTitle>
          <CardDescription className="line-clamp-2">{course.description}</CardDescription>
        </CardHeader>
      </Card>
    </Link>
  )
}
