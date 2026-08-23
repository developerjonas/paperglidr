import 'lesson_summary.dart';

class CourseSection {
  final String id;
  final String name;
  final int order;
  final List<LessonSummary> lessons;

  CourseSection({
    required this.id,
    required this.name,
    required this.order,
    required this.lessons,
  });

  factory CourseSection.fromJson(Map<String, dynamic> json) {
    return CourseSection(
      id: json['id'] as String,
      name: json['name'] as String? ?? '',
      order: json['order'] as int? ?? 0,
      lessons: (json['lessons'] as List<dynamic>? ?? [])
          .map((e) => LessonSummary.fromJson(e as Map<String, dynamic>))
          .toList(),
    );
  }
}