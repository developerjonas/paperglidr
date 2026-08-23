enum LessonStatus { public, private, preview, unknown }

LessonStatus _parseLessonStatus(String? s) {
  switch (s) {
    case 'public':
      return LessonStatus.public;
    case 'private':
      return LessonStatus.private;
    case 'preview':
      return LessonStatus.preview;
    default:
      return LessonStatus.unknown;
  }
}

/// Slim lesson info for the course outline — full content only loads
/// once you're inside LessonScreen.
class LessonSummary {
  final String id;
  final String name;
  final int order;
  final LessonStatus status;

  LessonSummary({
    required this.id,
    required this.name,
    required this.order,
    required this.status,
  });

  factory LessonSummary.fromJson(Map<String, dynamic> json) {
    return LessonSummary(
      id: json['id'] as String,
      name: json['name'] as String? ?? '',
      order: json['order'] as int? ?? 0,
      status: _parseLessonStatus(json['status'] as String?),
    );
  }
}