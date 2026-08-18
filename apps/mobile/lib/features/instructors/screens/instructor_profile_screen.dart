import 'package:flutter/material.dart';

/// Mirrors apps/web/src/app/(consumer)/instructors/[handle]/page.tsx
/// Public.
class InstructorProfileScreen extends StatelessWidget {
  final String handle;
  const InstructorProfileScreen({super.key, required this.handle});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('@$handle')),
      body: Center(child: Text('TODO: instructor bio + their courses, mirrors InstructorProfileCard.tsx')),
    );
  }
}
