import 'package:flutter/material.dart';

/// Mirrors apps/web/src/app/(consumer)/products/[productId]/page.tsx
/// Public — "Buy" button routes to PurchaseCheckoutScreen (auth-gated there, not here).
class ProductDetailScreen extends StatelessWidget {
  final String productId;
  const ProductDetailScreen({super.key, required this.productId});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Product $productId')),
      body: Center(child: Text('TODO: fetch product $productId, mirrors ProductCard.tsx')),
    );
  }
}
