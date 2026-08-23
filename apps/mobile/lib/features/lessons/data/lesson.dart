// lib/features/lessons/data/lesson.dart
import 'lesson_asset.dart';

class Lesson {
  final String id;
  final String name;
  final String? description;
  final List<LessonAsset> assets;

  Lesson({required this.id, required this.name, this.description, required this.assets});

  LessonAsset? get primaryAsset =>
      assets.where((a) => a.role == AssetRole.primary).firstOrNull;

  List<LessonAsset> get attachments =>
      assets.where((a) => a.role == AssetRole.attachment).toList();

  factory Lesson.fromJson(Map<String, dynamic> json) {
    return Lesson(
      id: json['id'] as String,
      name: json['name'] as String? ?? '',
      description: json['description'] as String?,
      assets: (json['assets'] as List<dynamic>? ?? [])
          .map((e) => LessonAsset.fromJson(e as Map<String, dynamic>))
          .toList(),
    );
  }
}