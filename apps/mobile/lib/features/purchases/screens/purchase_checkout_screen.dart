import 'package:flutter/material.dart';

/// Mirrors apps/web/src/app/(consumer)/products/[productId]/purchase/page.tsx
/// Auth required.
class PurchaseCheckoutScreen extends StatelessWidget {
  final String productId;
  const PurchaseCheckoutScreen({super.key, required this.productId});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Checkout')),
      body: Center(
        child: Text(
          'TODO: gateway picker (eSewa/Khalti/Fonepay) for product $productId, '
          'mirrors PurchaseGatewayPicker.tsx — likely a WebView redirect flow',
        ),
      ),
    );
  }
}
