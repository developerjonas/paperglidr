// lib/features/purchases/data/purchase.dart
enum PurchaseStatus { pending, completed, failed, unknown }

PurchaseStatus _statusFromString(String? s) {
  switch (s) {
    case 'pending':
      return PurchaseStatus.pending;
    case 'completed':
      return PurchaseStatus.completed;
    case 'failed':
      return PurchaseStatus.failed;
    default:
      return PurchaseStatus.unknown;
  }
}

class Purchase {
  final String id;
  final String productId;
  final String name;
  final String description;
  final String imageUrl;
  final PurchaseStatus status;
  final String gateway;
  final num? priceInRupeesPaid;
  final DateTime createdAt;

  Purchase({
    required this.id,
    required this.productId,
    required this.name,
    required this.description,
    required this.imageUrl,
    required this.status,
    required this.gateway,
    this.priceInRupeesPaid,
    required this.createdAt,
  });

  factory Purchase.fromJson(Map<String, dynamic> json) {
    return Purchase(
      id: json['id'] as String,
      productId: json['productId'] as String? ?? '',
      name: json['name'] as String? ?? '',
      description: json['description'] as String? ?? '',
      imageUrl: json['imageUrl'] as String? ?? '',
      status: _statusFromString(json['status'] as String?),
      gateway: json['gateway'] as String? ?? '',
      priceInRupeesPaid: json['priceInRupeesPaid'] as num?,
      createdAt: DateTime.tryParse(json['createdAt'] as String? ?? '') ?? DateTime.now(),
    );
  }
}