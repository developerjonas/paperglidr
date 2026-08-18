import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import '../api_client.dart';
import 'secure_storage.dart';

enum AuthStatus { unknown, authenticated, unauthenticated }

/// App-wide auth state. Mirrors what lib/auth-client.ts gives you on web,
/// but backed by a stored bearer token instead of a browser cookie.
///
/// Requires the `bearer` plugin enabled on the Better Auth server
/// (apps/web/src/services/auth.ts) — see the phase-3 note from earlier.
class AuthState extends ChangeNotifier {
  AuthStatus status = AuthStatus.unknown;
  String? userEmail; // extend with a real User model as needed

  /// Call once at app startup to restore a saved session.
  Future<void> bootstrap() async {
    final token = await TokenStorage.instance.readToken();
    status = token == null ? AuthStatus.unauthenticated : AuthStatus.authenticated;
    notifyListeners();
  }

  Future<String?> signIn({required String email, required String password}) async {
    final res = await http.post(
      Uri.parse('$kApiBaseUrl/api/auth/sign-in/email'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'email': email, 'password': password}),
    );

    if (res.statusCode != 200) {
      return _extractError(res);
    }

    final token = res.headers['set-auth-token'];
    if (token == null) {
      return 'Sign-in succeeded but no token was returned — '
          'confirm the bearer plugin is enabled on the server.';
    }

    await TokenStorage.instance.saveToken(token);
    userEmail = email;
    status = AuthStatus.authenticated;
    notifyListeners();
    return null; // null = success
  }

  Future<String?> signUp({
    required String name,
    required String email,
    required String password,
  }) async {
    final res = await http.post(
      Uri.parse('$kApiBaseUrl/api/auth/sign-up/email'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'name': name, 'email': email, 'password': password}),
    );

    if (res.statusCode != 200) {
      return _extractError(res);
    }

    final token = res.headers['set-auth-token'];
    if (token != null) {
      await TokenStorage.instance.saveToken(token);
      userEmail = email;
      status = AuthStatus.authenticated;
      notifyListeners();
    }
    return null;
  }

  Future<void> signOut() async {
    await TokenStorage.instance.clearToken();
    userEmail = null;
    status = AuthStatus.unauthenticated;
    notifyListeners();
  }

  String _extractError(http.Response res) {
    try {
      final body = jsonDecode(res.body);
      return body['message'] ?? 'Something went wrong (${res.statusCode}).';
    } catch (_) {
      return 'Something went wrong (${res.statusCode}).';
    }
  }
}
