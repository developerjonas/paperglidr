import 'dart:convert';
import 'package:http/http.dart' as http;
import 'auth/secure_storage.dart';

/// Base URL for your Next.js backend.
/// TODO: point this at your deployed apps/web URL (or localhost while
/// developing — use 10.0.2.2 instead of localhost on the Android emulator).
const String kApiBaseUrl = 'https://your-paperglidr-domain.com';

/// Single HTTP client for the whole app. Every feature's data/ layer
/// should go through this instead of calling package:http directly,
/// so auth headers and 401 handling stay in one place.
class ApiClient {
  ApiClient._();
  static final ApiClient instance = ApiClient._();

  /// Called whenever a request comes back 401. Wire this up to
  /// AuthState.signOut() in main.dart so an expired token bounces
  /// the user back to the sign-in screen automatically.
  Future<void> Function()? onUnauthorized;

  Future<Map<String, String>> _headers() async {
    final token = await TokenStorage.instance.readToken();
    return {
      'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }

  Future<http.Response> get(String path) async {
    final res = await http.get(
      Uri.parse('$kApiBaseUrl$path'),
      headers: await _headers(),
    );
    await _checkAuth(res);
    return res;
  }

  Future<http.Response> post(String path, {Object? body}) async {
    final res = await http.post(
      Uri.parse('$kApiBaseUrl$path'),
      headers: await _headers(),
      body: body == null ? null : jsonEncode(body),
    );
    await _checkAuth(res);
    return res;
  }

  Future<http.Response> put(String path, {Object? body}) async {
    final res = await http.put(
      Uri.parse('$kApiBaseUrl$path'),
      headers: await _headers(),
      body: body == null ? null : jsonEncode(body),
    );
    await _checkAuth(res);
    return res;
  }

  Future<http.Response> delete(String path) async {
    final res = await http.delete(
      Uri.parse('$kApiBaseUrl$path'),
      headers: await _headers(),
    );
    await _checkAuth(res);
    return res;
  }

  Future<void> _checkAuth(http.Response res) async {
    if (res.statusCode == 401 && onUnauthorized != null) {
      await onUnauthorized!();
    }
  }
}
