// lib/features/courses/data/courses_api.dart
import 'dart:convert';
import '../../../core/api_client.dart';
import '../../../core/api_paths.dart';
import 'course.dart';

class CoursesApi {
  static Future<List<Course>> fetchPublicCourses({int? limit}) async {
    final path = limit != null ? '$kApiV1/courses?limit=$limit' : '$kApiV1/courses';
    final res = await ApiClient.instance.get(path);
    if (res.statusCode != 200) {
      throw Exception('Failed to load courses (${res.statusCode})');
    }
    final list = jsonDecode(res.body) as List<dynamic>;
    return list.map((e) => Course.fromJson(e as Map<String, dynamic>)).toList();
  }

  static Future<Course> fetchCourse(String courseId) async {
    final res = await ApiClient.instance.get('$kApiV1/courses/$courseId');
    if (res.statusCode != 200) {
      throw Exception('Failed to load course (${res.statusCode})');
    }
    return Course.fromJson(jsonDecode(res.body) as Map<String, dynamic>);
  }
}