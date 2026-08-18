import 'package:flutter/material.dart';

/// Mirrors apps/web/src/app/(consumer)/courses/[courseId]/page.tsx
/// Public — course overview + section/lesson list.
class CourseDetailScreen extends StatelessWidget {
  final String courseId;
  const CourseDetailScreen({super.key, required this.courseId});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Course $courseId')),
      body: Center(child: Text('TODO: fetch course $courseId, list sections/lessons')),
    );
  }
}
