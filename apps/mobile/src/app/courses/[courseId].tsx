import { PlaceholderScreen } from '@/components/placeholder-screen';

export default function CourseScreen() {
  return (
    <PlaceholderScreen
      title="Course"
      description="The public outline: sections and lessons, with free previews playable."
      api="GET /api/v1/courses/:id"
      links={[
        { label: "A preview lesson", href: "/lessons/sample" },
      ]}
    />
  );
}
