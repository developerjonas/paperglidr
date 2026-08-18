import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

/// Mirrors features/products/components/ProductCard.tsx — example of
/// how a feature's widgets/ folder should look. Replicate this pattern
/// (a data model + a card widget) for instructors, products, etc.
class CourseCard extends StatelessWidget {
  final String courseId;
  final String title;
  final String? imageUrl;

  const CourseCard({
    super.key,
    required this.courseId,
    required this.title,
    this.imageUrl,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: () => context.push('/courses/$courseId'),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (imageUrl != null)
              AspectRatio(
                aspectRatio: 16 / 9,
                child: Image.network(imageUrl!, fit: BoxFit.cover),
              ),
            Padding(
              padding: const EdgeInsets.all(12),
              child: Text(title, style: Theme.of(context).textTheme.titleMedium),
            ),
          ],
        ),
      ),
    );
  }
}
