// lib/features/courses/data/my_courses_api.dart
import 'dart:convert';
import '../../../core/api_client.dart';
import '../../../core/api_paths.dart';
import 'my_course.dart';

class MyCoursesApi {
  static Future<List<MyCourse>> fetchMyCourses() async {
    final res = await ApiClient.instance.get('$kApiV1/me/courses');
    if (res.statusCode != 200) {
      throw Exception('Failed to load your courses (${res.statusCode})');
    }
    final list = jsonDecode(res.body) as List<dynamic>;
    return list.map((e) => MyCourse.fromJson(e as Map<String, dynamic>)).toList();
  }
}