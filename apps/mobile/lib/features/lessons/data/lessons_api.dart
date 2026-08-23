// lib/features/lessons/data/lessons_api.dart
import 'dart:convert';
import '../../../core/api_client.dart';
import '../../../core/api_paths.dart';
import 'lesson.dart';

class LessonsApi {
  static Future<Lesson> fetchLesson(String lessonId) async {
    final res = await ApiClient.instance.get('$kApiV1/lessons/$lessonId');
    if (res.statusCode == 403) throw Exception("You don't have access to this lesson");
    if (res.statusCode == 404) throw Exception('Lesson not found');
    if (res.statusCode != 200) throw Exception('Failed to load lesson (${res.statusCode})');
    return Lesson.fromJson(jsonDecode(res.body) as Map<String, dynamic>);
  }

  static Future<void> markComplete(String lessonId) async {
    final res = await ApiClient.instance.post('$kApiV1/lessons/$lessonId/complete');
    if (res.statusCode != 200) {
      throw Exception('Failed to mark lesson complete (${res.statusCode})');
    }
  }

  /// Reuses your existing web-only deliver endpoint as-is — not versioned,
  /// not rebuilt. Widgets attach the bearer token as a header when loading
  /// this URL directly (video_player, webview, just_audio, Image.network).
  static String deliverUrlFor({required String lessonId, required String assetId}) =>
      '$kApiBaseUrl/api/lessons/$lessonId/assets/$assetId/deliver';
}