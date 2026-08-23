// lib/features/wishlist/data/wishlist_api.dart
import 'dart:convert';
import '../../../core/api_client.dart';
import '../../../core/api_paths.dart';
import 'wishlist_item.dart';

class WishlistApi {
  static Future<List<WishlistItem>> fetchMyWishlist() async {
    final res = await ApiClient.instance.get('$kApiV1/wishlist');
    if (res.statusCode != 200) {
      throw Exception('Failed to load wishlist (${res.statusCode})');
    }
    final list = jsonDecode(res.body) as List<dynamic>;
    return list.map((e) => WishlistItem.fromJson(e as Map<String, dynamic>)).toList();
  }

  static Future<void> add(String productId) async {
    final res = await ApiClient.instance.post('$kApiV1/wishlist', body: {'productId': productId});
    if (res.statusCode != 200) {
      throw Exception('Failed to add to wishlist (${res.statusCode})');
    }
  }

  static Future<void> remove(String productId) async {
    final res = await ApiClient.instance.delete('$kApiV1/wishlist/$productId');
    if (res.statusCode != 200) {
      throw Exception('Failed to remove from wishlist (${res.statusCode})');
    }
  }
}