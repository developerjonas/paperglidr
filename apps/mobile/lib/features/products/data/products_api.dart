// lib/features/products/data/products_api.dart
import 'dart:convert';
import '../../../core/api_client.dart';
import '../../../core/api_paths.dart';
import 'product.dart';

class ProductsApi {
  static Future<List<Product>> fetchPublicProducts({int? limit}) async {
    final path = limit != null ? '$kApiV1/products?limit=$limit' : '$kApiV1/products';
    final res = await ApiClient.instance.get(path);
    if (res.statusCode != 200) {
      throw Exception('Failed to load products (${res.statusCode})');
    }
    final list = jsonDecode(res.body) as List<dynamic>;
    return list.map((e) => Product.fromJson(e as Map<String, dynamic>)).toList();
  }

  static Future<Product> fetchProduct(String productId) async {
    final res = await ApiClient.instance.get('$kApiV1/products/$productId');
    if (res.statusCode == 404) throw Exception('Product not found');
    if (res.statusCode != 200) throw Exception('Failed to load product (${res.statusCode})');
    return Product.fromJson(jsonDecode(res.body) as Map<String, dynamic>);
  }
}