import 'package:flutter/material.dart';

/// Mirrors apps/web/src/app/(consumer)/certificates/page.tsx
class CertificatesListScreen extends StatelessWidget {
  const CertificatesListScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Certificates')),
      body: const Center(child: Text('TODO: list earned certificates, mirrors CertificateCard.tsx')),
    );
  }
}
