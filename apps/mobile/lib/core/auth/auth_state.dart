// lib/core/auth/auth_state.dart
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import '../api_client.dart';
import 'secure_storage.dart';

enum AuthStatus { unknown, authenticated, unauthenticated }

class AppUser {
  final String id;
  final String name;
  final String email;
  final bool emailVerified;

  AppUser({
    required this.id,
    required this.name,
    required this.email,
    required this.emailVerified,
  });

  factory AppUser.fromJson(Map<String, dynamic> json) {
    return AppUser(
      id: json['id'] as String,
      name: json['name'] as String? ?? '',
      email: json['email'] as String? ?? '',
      emailVerified: json['emailVerified'] as bool? ?? false,
    );
  }
}

class AuthState extends ChangeNotifier {
  AuthStatus status = AuthStatus.unknown;
  AppUser? user;

  /// Call once at app startup. Verifies the stored token against the
  /// server rather than trusting its mere presence.
  Future<void> bootstrap() async {
    final token = await TokenStorage.instance.readToken();
    if (token == null) {
      status = AuthStatus.unauthenticated;
      notifyListeners();
      return;
    }

    final res = await http.get(
      Uri.parse('$kApiBaseUrl/api/auth/get-session'),
      headers: {'Authorization': 'Bearer $token'},
    );

    if (res.statusCode == 200 && res.body.isNotEmpty && res.body != 'null') {
      final body = jsonDecode(res.body);
      final userJson = body['user'] as Map<String, dynamic>?;
      if (userJson != null) {
        user = AppUser.fromJson(userJson);
        status = AuthStatus.authenticated;
        notifyListeners();
        return;
      }
    }

    // Token invalid/expired — clear it and fall back to signed-out.
    await TokenStorage.instance.clearToken();
    status = AuthStatus.unauthenticated;
    notifyListeners();
  }

  Future<String?> signIn({required String email, required String password}) async {
    final res = await http.post(
      Uri.parse('$kApiBaseUrl/api/auth/sign-in/email'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'email': email, 'password': password}),
    );

    if (res.statusCode != 200) return _extractError(res);

    final token = res.headers['set-auth-token'];
    if (token == null) {
      return 'Sign-in succeeded but no token was returned — '
          'confirm the bearer plugin is enabled on the server.';
    }

    await TokenStorage.instance.saveToken(token);
    final body = jsonDecode(res.body);
    final userJson = body['user'] as Map<String, dynamic>?;
    if (userJson != null) user = AppUser.fromJson(userJson);
    status = AuthStatus.authenticated;
    notifyListeners();
    return null;
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

    if (res.statusCode != 200) return _extractError(res);

    final token = res.headers['set-auth-token'];
    if (token != null) {
      await TokenStorage.instance.saveToken(token);
      final body = jsonDecode(res.body);
      final userJson = body['user'] as Map<String, dynamic>?;
      if (userJson != null) user = AppUser.fromJson(userJson);
      status = AuthStatus.authenticated;
      notifyListeners();
    }
    return null;
  }

  Future<void> signOut() async {
    await TokenStorage.instance.clearToken();
    user = null;
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