// lib/core/auth/request_headers.dart
import 'secure_storage.dart';

/// For the few places (video_player, webview_flutter, just_audio,
/// Image.network) that load a URL directly rather than going through
/// ApiClient — they still need the bearer token attached manually.
class RequestHeaders {
  static Future<Map<String, String>> auth() async {
    final token = await TokenStorage.instance.readToken();
    return {if (token != null) 'Authorization': 'Bearer $token'};
  }
}