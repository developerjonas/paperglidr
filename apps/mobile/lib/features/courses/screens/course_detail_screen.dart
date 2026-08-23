import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../data/course.dart';
import '../data/course_section.dart';
import '../data/lesson_summary.dart';
import '../data/courses_api.dart';
import '../../../shared/widgets/empty_state.dart';
import '../../../shared/widgets/loading_indicator.dart';

/// Mirrors apps/web/src/app/(consumer)/courses/[courseId]/page.tsx
class CourseDetailScreen extends StatefulWidget {
  final String courseId;
  const CourseDetailScreen({super.key, required this.courseId});

  @override
  State<CourseDetailScreen> createState() => _CourseDetailScreenState();
}

class _CourseDetailScreenState extends State<CourseDetailScreen> {
  late Future<Course> _future;

  @override
  void initState() {
    super.initState();
    _future = CoursesApi.fetchCourse(widget.courseId);
  }

  IconData _iconFor(LessonStatus status) {
    switch (status) {
      case LessonStatus.public:
      case LessonStatus.preview:
        return Icons.play_circle_outline;
      case LessonStatus.private:
        return Icons.lock_outline;
      case LessonStatus.unknown:
        return Icons.circle_outlined;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Course')),
      body: FutureBuilder<Course>(
        future: _future,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const LoadingIndicator();
          }
          if (snapshot.hasError) {
            return EmptyState(
              icon: Icons.error_outline,
              message: 'Could not load course.\n${snapshot.error}',
            );
          }

          final course = snapshot.data!;

          return ListView(
            children: [
              if (course.imageUrl.isNotEmpty)
                AspectRatio(
                  aspectRatio: 16 / 9,
                  child: Image.network(course.imageUrl, fit: BoxFit.cover),
                ),
              Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(course.name, style: Theme.of(context).textTheme.headlineSmall),
                    const SizedBox(height: 8),
                    Text(course.description, style: Theme.of(context).textTheme.bodyMedium),
                    if (course.totalLessons > 0) ...[
                      const SizedBox(height: 8),
                      Text(
                        '${course.sections.length} sections · ${course.totalLessons} lessons',
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                    ],
                    const SizedBox(height: 20),
                    FilledButton(
                      onPressed: () {
                        // TODO: context.push('/products/${course.id}/purchase')
                      },
                      child: Text(
                        course.priceInRupees == 0
                            ? 'Enroll for free'
                            : 'Buy — Rs. ${course.priceInRupees}',
                      ),
                    ),
                  ],
                ),
              ),
              if (course.sections.isEmpty)
                const Padding(
                  padding: EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  child: EmptyState(message: 'No lessons published yet.'),
                )
              else ...[
                const Divider(height: 1),
                ...course.sections.map((section) => _SectionTile(
                      courseId: course.id,
                      section: section,
                      iconFor: _iconFor,
                    )),
              ],
              const SizedBox(height: 20),
            ],
          );
        },
      ),
    );
  }
}

class _SectionTile extends StatelessWidget {
  final String courseId;
  final CourseSection section;
  final IconData Function(LessonStatus) iconFor;

  const _SectionTile({
    required this.courseId,
    required this.section,
    required this.iconFor,
  });

  @override
  Widget build(BuildContext context) {
    return ExpansionTile(
      initiallyExpanded: true,
      title: Text(section.name, style: Theme.of(context).textTheme.titleMedium),
      subtitle: Text('${section.lessons.length} lessons'),
      children: section.lessons.map((lesson) {
        return ListTile(
          leading: Icon(iconFor(lesson.status)),
          title: Text(lesson.name),
          trailing: const Icon(Icons.chevron_right, size: 20),
          onTap: () => context.push('/courses/$courseId/lessons/${lesson.id}'),
        );
      }).toList(),
    );
  }
}