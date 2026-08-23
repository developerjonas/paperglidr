// lib/features/products/data/product.dart
import 'product_course.dart';

class Product {
  final String id;
  final String name;
  final String description;
  final String imageUrl;
  final num priceInRupees;
  final double? avgRating;
  final int reviewCount;
  final List<ProductCourse> courses; // only populated on detail fetch

  Product({
    required this.id,
    required this.name,
    required this.description,
    required this.imageUrl,
    required this.priceInRupees,
    this.avgRating,
    required this.reviewCount,
    this.courses = const [],
  });

  factory Product.fromJson(Map<String, dynamic> json) {
    return Product(
      id: json['id'] as String,
      name: json['name'] as String? ?? '',
      description: json['description'] as String? ?? '',
      imageUrl: json['imageUrl'] as String? ?? '',
      priceInRupees: json['priceInRupees'] as num? ?? 0,
      avgRating: (json['avgRating'] as num?)?.toDouble(),
      reviewCount: json['reviewCount'] as int? ?? 0,
      courses: (json['courses'] as List<dynamic>? ?? [])
          .map((e) => ProductCourse.fromJson(e as Map<String, dynamic>))
          .toList(),
    );
  }
}