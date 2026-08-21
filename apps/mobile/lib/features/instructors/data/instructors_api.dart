import 'dart:convert';
import '../../../core/api_client.dart';
import '../../../core/api_paths.dart';
import 'instructor.dart';

class InstructorsApi {
  static Future<Instructor> fetchByHandle(String handle) async {
    final res = await ApiClient.instance.get('$kApiV1/instructors/$handle');
    if (res.statusCode == 404) {
      throw Exception('Instructor not found');
    }
    if (res.statusCode != 200) {
      throw Exception('Failed to load instructor (${res.statusCode})');
    }
    return Instructor.fromJson(jsonDecode(res.body) as Map<String, dynamic>);
  }
}