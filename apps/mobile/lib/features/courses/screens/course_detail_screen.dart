// lib/features/courses/screens/course_detail_screen.dart
import 'package:flutter/material.dart';
import '../data/course.dart';
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
            padding: const EdgeInsets.all(16),
            children: [
              if (course.imageUrl.isNotEmpty)
                ClipRRect(
                  borderRadius: BorderRadius.circular(12),
                  child: AspectRatio(
                    aspectRatio: 16 / 9,
                    child: Image.network(course.imageUrl, fit: BoxFit.cover),
                  ),
                ),
              const SizedBox(height: 16),
              Text(course.name, style: Theme.of(context).textTheme.headlineSmall),
              const SizedBox(height: 8),
              Text(course.description, style: Theme.of(context).textTheme.bodyMedium),
              const SizedBox(height: 20),
              FilledButton(
                onPressed: () {
                  // TODO: context.push('/products/${course.id}/purchase')
                },
                child: Text(
                  course.priceInRupees == 0 ? 'Enroll for free' : 'Buy — Rs. ${course.priceInRupees}',
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}