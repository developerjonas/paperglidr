import 'package:flutter/material.dart';

/// Mirrors apps/web/src/app/(consumer)/purchases/[purchaseId]/page.tsx
class PurchaseDetailScreen extends StatelessWidget {
  final String purchaseId;
  const PurchaseDetailScreen({super.key, required this.purchaseId});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Purchase $purchaseId')),
      body: Center(child: Text('TODO: purchase detail + invoice + refund request')),
    );
  }
}
