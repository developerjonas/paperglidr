import 'package:flutter/material.dart';

/// Mirrors apps/web/src/app/(consumer)/wishlist/page.tsx
class WishlistScreen extends StatelessWidget {
  const WishlistScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Wishlist')),
      body: const Center(child: Text('TODO: list wishlisted products, mirrors WishlistButton.tsx logic')),
    );
  }
}
