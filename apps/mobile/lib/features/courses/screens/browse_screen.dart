import 'package:flutter/material.dart';

/// Mirrors apps/web/src/app/(consumer)/browse/page.tsx
/// Public — hits the same public course/product listing endpoint,
/// no bearer token attached.
class BrowseScreen extends StatelessWidget {
  const BrowseScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Browse')),
      body: const Center(child: Text('TODO: fetch via features/courses/data, list CourseCard widgets')),
    );
  }
}
