import 'dart:convert';
import '../../../core/api_client.dart';

/// Example data layer for the courses feature — mirrors
/// apps/web/src/features/courses/db/courses.ts, but as HTTP calls
/// against your existing Next.js routes/actions instead of direct
/// Drizzle queries. Replicate this pattern per feature.
class CoursesApi {
  static Future<List<dynamic>> fetchPublicCourses() async {
    final res = await ApiClient.instance.get('/api/courses'); // TODO: confirm real path
    if (res.statusCode != 200) {
      throw Exception('Failed to load courses (${res.statusCode})');
    }
    return jsonDecode(res.body) as List<dynamic>;
  }

  static Future<Map<String, dynamic>> fetchCourse(String courseId) async {
    final res = await ApiClient.instance.get('/api/courses/$courseId'); // TODO: confirm real path
    if (res.statusCode != 200) {
      throw Exception('Failed to load course (${res.statusCode})');
    }
    return jsonDecode(res.body) as Map<String, dynamic>;
  }
}
