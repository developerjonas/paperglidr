// lib/features/purchases/data/purchases_api.dart
import 'dart:convert';
import '../../../core/api_client.dart';
import '../../../core/api_paths.dart';
import 'purchase.dart';

/// Read-only for now — checkout stays web-only until the purchase
/// flow is built in the app (WebView redirect to eSewa/Khalti/Fonepay).
class PurchasesApi {
  static Future<List<Purchase>> fetchMyPurchases() async {
    final res = await ApiClient.instance.get('$kApiV1/purchases');
    if (res.statusCode != 200) {
      throw Exception('Failed to load purchases (${res.statusCode})');
    }
    final list = jsonDecode(res.body) as List<dynamic>;
    return list.map((e) => Purchase.fromJson(e as Map<String, dynamic>)).toList();
  }
}