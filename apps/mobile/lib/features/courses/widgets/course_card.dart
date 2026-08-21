// lib/features/courses/widgets/course_card.dart
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../data/course.dart';

/// Mirrors apps/web/src/features/products/components/ProductCard.tsx
class CourseCard extends StatelessWidget {
  final Course course;
  const CourseCard({super.key, required this.course});

  @override
  Widget build(BuildContext context) {
    final hasRating = course.avgRating != null && course.reviewCount > 0;
    final muted = Theme.of(context).textTheme.bodySmall?.copyWith(color: Colors.grey);

    return Card(
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: () => context.push('/courses/${course.id}'),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            AspectRatio(
              aspectRatio: 16 / 9,
              child: course.imageUrl.isEmpty
                  ? Container(color: Theme.of(context).colorScheme.surfaceContainerHighest)
                  : Image.network(course.imageUrl, fit: BoxFit.cover),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(12, 10, 12, 0),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    course.priceInRupees == 0 ? 'Free' : 'Rs. ${course.priceInRupees}',
                    style: muted,
                  ),
                  if (hasRating)
                    Row(
                      children: [
                        const Icon(Icons.star, size: 14, color: Colors.amber),
                        const SizedBox(width: 2),
                        Text(
                          '${course.avgRating!.toStringAsFixed(1)} (${course.reviewCount})',
                          style: muted,
                        ),
                      ],
                    ),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(12, 4, 12, 0),
              child: Text(
                course.name,
                style: Theme.of(context).textTheme.titleMedium,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(12, 2, 12, 12),
              child: Text(
                course.description,
                style: muted,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ),
      ),
    );
  }
}