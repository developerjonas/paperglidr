import { PlaceholderScreen } from '@/components/placeholder-screen';

export default function InstructorScreen() {
  return (
    <PlaceholderScreen
      title="Instructor"
      description="The instructor's profile and their courses."
      api="GET /api/v1/instructors/:handle"
      links={[
        { label: "One of their products", href: "/products/sample" },
      ]}
    />
  );
}
