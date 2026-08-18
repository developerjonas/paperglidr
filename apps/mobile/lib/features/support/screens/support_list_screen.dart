import 'package:flutter/material.dart';

/// Mirrors apps/web/src/app/(consumer)/support/page.tsx
class SupportListScreen extends StatelessWidget {
  const SupportListScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Support')),
      body: const Center(child: Text('TODO: list tickets, FAB to New Support Ticket')),
    );
  }
}
