import 'package:flutter/material.dart';

/// Mirrors apps/web/src/app/(consumer)/page.tsx — the landing/home tab.
/// Public, no auth required.
class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('paperglidr')),
      body: const Center(child: Text('TODO: featured courses/products, mirrors (consumer)/page.tsx')),
    );
  }
}
