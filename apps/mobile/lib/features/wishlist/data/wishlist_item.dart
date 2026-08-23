// lib/features/wishlist/data/wishlist_item.dart
class WishlistItem {
  final String wishlistItemId;
  final String productId;
  final String name;
  final String description;
  final String imageUrl;
  final num priceInRupees;
  final DateTime addedAt;

  WishlistItem({
    required this.wishlistItemId,
    required this.productId,
    required this.name,
    required this.description,
    required this.imageUrl,
    required this.priceInRupees,
    required this.addedAt,
  });

  factory WishlistItem.fromJson(Map<String, dynamic> json) {
    return WishlistItem(
      wishlistItemId: json['wishlistItemId'] as String,
      productId: json['productId'] as String,
      name: json['name'] as String? ?? '',
      description: json['description'] as String? ?? '',
      imageUrl: json['imageUrl'] as String? ?? '',
      priceInRupees: json['priceInRupees'] as num? ?? 0,
      addedAt: DateTime.tryParse(json['addedAt'] as String? ?? '') ?? DateTime.now(),
    );
  }
}