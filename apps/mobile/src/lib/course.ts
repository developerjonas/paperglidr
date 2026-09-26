type Outline = { sections: { lessons: { id: string; isComplete?: boolean }[] }[] };

/** Lessons in course order (sections, then lessons — the website's order). */
export function lessonOrder(course: Outline) {
  return course.sections.flatMap((section) => section.lessons);
}

/** The first lesson not yet completed, or the first lesson. */
export function nextLessonId(course: Outline) {
  const lessons = lessonOrder(course);
  return (lessons.find((lesson) => !lesson.isComplete) ?? lessons[0])?.id;
}

/** The lessons before and after this one, as the website's Previous / Next. */
export function neighbours(course: Outline, lessonId: string) {
  const lessons = lessonOrder(course);
  const index = lessons.findIndex((lesson) => lesson.id === lessonId);
  if (index === -1) return { previous: undefined, next: undefined };
  return { previous: lessons[index - 1]?.id, next: lessons[index + 1]?.id };
}
