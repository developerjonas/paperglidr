// lib/features/courses/screens/browse_screen.dart
import 'package:flutter/material.dart';
import '../data/course.dart';
import '../data/courses_api.dart';
import '../widgets/course_card.dart';
import '../../../shared/widgets/empty_state.dart';
import '../../../shared/widgets/loading_indicator.dart';

/// Mirrors apps/web/src/app/(consumer)/browse/page.tsx
/// Public — hits /api/v1/courses, no bearer token attached.
class BrowseScreen extends StatefulWidget {
  const BrowseScreen({super.key});

  @override
  State<BrowseScreen> createState() => _BrowseScreenState();
}

class _BrowseScreenState extends State<BrowseScreen> {
  late Future<List<Course>> _future;

  @override
  void initState() {
    super.initState();
    _future = CoursesApi.fetchPublicCourses();
  }

  Future<void> _refresh() async {
    final next = CoursesApi.fetchPublicCourses();
    setState(() => _future = next);
    await next;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Browse')),
      body: RefreshIndicator(
        onRefresh: _refresh,
        child: FutureBuilder<List<Course>>(
          future: _future,
          builder: (context, snapshot) {
            if (snapshot.connectionState == ConnectionState.waiting) {
              return const LoadingIndicator();
            }
            if (snapshot.hasError) {
              return ListView(
                children: [
                  const SizedBox(height: 80),
                  EmptyState(
                    icon: Icons.error_outline,
                    message: 'Could not load courses.\n${snapshot.error}',
                  ),
                ],
              );
            }
            final courses = snapshot.data ?? [];
            if (courses.isEmpty) {
              return ListView(
                children: const [
                  SizedBox(height: 80),
                  EmptyState(message: 'No courses published yet.'),
                ],
              );
            }
            return GridView.builder(
              padding: const EdgeInsets.all(12),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                mainAxisSpacing: 12,
                crossAxisSpacing: 12,
                childAspectRatio: 0.72,
              ),
              itemCount: courses.length,
              itemBuilder: (context, i) => CourseCard(course: courses[i]),
            );
          },
        ),
      ),
    );
  }
}