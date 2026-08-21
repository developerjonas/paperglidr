// lib/features/courses/data/course.dart
class Course {
  final String id;
  final String name;
  final String description;
  final String imageUrl;
  final num priceInRupees;
  final double? avgRating;
  final int reviewCount;

  Course({
    required this.id,
    required this.name,
    required this.description,
    required this.imageUrl,
    required this.priceInRupees,
    this.avgRating,
    required this.reviewCount,
  });

  factory Course.fromJson(Map<String, dynamic> json) {
    return Course(
      id: json['id'] as String,
      name: json['name'] as String? ?? '',
      description: json['description'] as String? ?? '',
      imageUrl: json['imageUrl'] as String? ?? '',
      priceInRupees: json['priceInRupees'] as num? ?? 0,
      avgRating: (json['avgRating'] as num?)?.toDouble(),
      reviewCount: json['reviewCount'] as int? ?? 0,
    );
  }
}