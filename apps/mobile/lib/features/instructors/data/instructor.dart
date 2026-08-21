// lib/features/instructors/data/instructor.dart
class Instructor {
  final String handle;
  final String name;
  final String? bio;
  final String? avatarUrl;
  final List<InstructorCourse> courses;

  Instructor({
    required this.handle,
    required this.name,
    this.bio,
    this.avatarUrl,
    this.courses = const [],
  });

  factory Instructor.fromJson(Map<String, dynamic> json) {
    return Instructor(
      handle: json['handle'] as String,
      name: json['name'] as String? ?? '',
      bio: json['bio'] as String?,
      avatarUrl: json['avatarUrl'] as String?,
      courses: (json['courses'] as List<dynamic>? ?? [])
          .map((e) => InstructorCourse.fromJson(e as Map<String, dynamic>))
          .toList(),
    );
  }
}

/// Slim version of Course for the "courses by this instructor" list —
/// avoids depending on the full courses feature's model.
class InstructorCourse {
  final String id;
  final String name;
  final String imageUrl;

  InstructorCourse({required this.id, required this.name, required this.imageUrl});

  factory InstructorCourse.fromJson(Map<String, dynamic> json) {
    return InstructorCourse(
      id: json['id'] as String,
      name: json['name'] as String? ?? '',
      imageUrl: json['imageUrl'] as String? ?? '',
    );
  }
}