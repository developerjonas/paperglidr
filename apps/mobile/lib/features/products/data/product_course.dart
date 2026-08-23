class ProductCourse {
  final String courseId;
  final String courseName;

  ProductCourse({required this.courseId, required this.courseName});

  factory ProductCourse.fromJson(Map<String, dynamic> json) {
    return ProductCourse(
      courseId: json['courseId'] as String,
      courseName: json['courseName'] as String? ?? '',
    );
  }
}