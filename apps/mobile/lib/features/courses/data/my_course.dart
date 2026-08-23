// lib/features/courses/data/my_course.dart
class MyCourse {
  final String id;
  final String name;
  final String description;
  final int totalLessons;
  final int completedLessons;

  MyCourse({
    required this.id,
    required this.name,
    required this.description,
    required this.totalLessons,
    required this.completedLessons,
  });

  double get progress => totalLessons == 0 ? 0 : completedLessons / totalLessons;
  bool get isComplete => totalLessons > 0 && completedLessons == totalLessons;

  factory MyCourse.fromJson(Map<String, dynamic> json) {
    return MyCourse(
      id: json['id'] as String,
      name: json['name'] as String? ?? '',
      description: json['description'] as String? ?? '',
      totalLessons: json['totalLessons'] as int? ?? 0,
      completedLessons: json['completedLessons'] as int? ?? 0,
    );
  }
}