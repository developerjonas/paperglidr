import 'package:flutter/material.dart';

/// Mirrors apps/web/src/app/(consumer)/purchases/page.tsx
/// Auth required.
class PurchasesListScreen extends StatelessWidget {
  const PurchasesListScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('My Purchases')),
      body: const Center(child: Text('TODO: list purchases, mirrors UserPurchaseTable.tsx')),
    );
  }
}
