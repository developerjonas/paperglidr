import 'package:flutter/material.dart';

/// Mirrors apps/web/src/app/(consumer)/courses/[courseId]/lessons/[lessonId]/page.tsx
/// Requires auth + course access — route guard lives in router.dart.
class LessonScreen extends StatelessWidget {
  final String courseId;
  final String lessonId;
  const LessonScreen({super.key, required this.courseId, required this.lessonId});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Lesson $lessonId')),
      body: Center(
        child: Text(
          'TODO: video/PDF viewer using Bunny stream token, '
          'mirrors VideoLessonViewer.tsx / PdfLessonViewer.tsx',
        ),
      ),
    );
  }
}
