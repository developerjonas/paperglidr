// lib/features/account/data/account_api.dart
import 'dart:convert';
import 'package:http/http.dart' as http;
import '../../../core/api_client.dart';
import '../../../core/auth/secure_storage.dart';

/// Calls Better Auth's own /api/auth/update-user endpoint directly
/// (not a /api/v1 route — this belongs to auth, not your app's API).
class AccountApi {
  static Future<void> updateProfile({required String name}) async {
    final token = await TokenStorage.instance.readToken();
    final res = await http.post(
      Uri.parse('$kApiBaseUrl/api/auth/update-user'),
      headers: {
        'Content-Type': 'application/json',
        if (token != null) 'Authorization': 'Bearer $token',
      },
      body: jsonEncode({'name': name}),
    );
    if (res.statusCode != 200) {
      throw Exception('Failed to update profile (${res.statusCode})');
    }
  }
}