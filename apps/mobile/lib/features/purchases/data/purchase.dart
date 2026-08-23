// lib/features/purchases/data/purchase.dart
enum PurchaseStatus { pending, completed, failed, refunded, disputed, unknown }

PurchaseStatus _statusFromString(String? s) {
  switch (s) {
    case 'pending':
      return PurchaseStatus.pending;
    case 'completed':
      return PurchaseStatus.completed;
    case 'failed':
      return PurchaseStatus.failed;
    case 'refunded':
      return PurchaseStatus.refunded;
    case 'disputed':
      return PurchaseStatus.disputed;
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
  final int pricePaidInPaisa;
  final DateTime createdAt;

  Purchase({
    required this.id,
    required this.productId,
    required this.name,
    required this.description,
    required this.imageUrl,
    required this.status,
    required this.gateway,
    required this.pricePaidInPaisa,
    required this.createdAt,
  });

  /// Paisa is NPR's subunit — 100 paisa = ₹1. Display-only conversion;
  /// the source of truth stays in paisa to avoid rounding drift.
  double get priceInRupeesPaid => pricePaidInPaisa / 100;

  factory Purchase.fromJson(Map<String, dynamic> json) {
    return Purchase(
      id: json['id'] as String,
      productId: json['productId'] as String? ?? '',
      name: json['name'] as String? ?? '',
      description: json['description'] as String? ?? '',
      imageUrl: json['imageUrl'] as String? ?? '',
      status: _statusFromString(json['status'] as String?),
      gateway: json['gateway'] as String? ?? '',
      pricePaidInPaisa: json['pricePaidInPaisa'] as int? ?? 0,
      createdAt: DateTime.tryParse(json['createdAt'] as String? ?? '') ?? DateTime.now(),
    );
  }
}