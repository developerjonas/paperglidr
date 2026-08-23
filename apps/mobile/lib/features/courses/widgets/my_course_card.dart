// lib/features/courses/widgets/my_course_card.dart
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../data/my_course.dart';

class MyCourseCard extends StatelessWidget {
  final MyCourse course;
  const MyCourseCard({super.key, required this.course});

  @override
  Widget build(BuildContext context) {
    return Card(
      clipBehavior: Clip.antiAlias,
      margin: const EdgeInsets.only(bottom: 10),
      child: InkWell(
        onTap: () => context.push('/courses/${course.id}'),
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Row(
            children: [
              CircleAvatar(
                radius: 24,
                backgroundColor: course.isComplete
                    ? Colors.green.shade100
                    : Theme.of(context).colorScheme.primaryContainer,
                child: Icon(
                  course.isComplete ? Icons.check : Icons.play_arrow,
                  color: course.isComplete ? Colors.green.shade800 : null,
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      course.name,
                      style: Theme.of(context).textTheme.titleMedium,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 6),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(4),
                      child: LinearProgressIndicator(
                        value: course.progress,
                        minHeight: 6,
                        backgroundColor: Theme.of(context).colorScheme.surfaceContainerHighest,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      course.totalLessons == 0
                          ? 'No lessons yet'
                          : '${course.completedLessons}/${course.totalLessons} lessons complete',
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                  ],
                ),
              ),
              const Icon(Icons.chevron_right, size: 20),
            ],
          ),
        ),
      ),
    );
  }
}