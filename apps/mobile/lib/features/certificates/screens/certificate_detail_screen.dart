import 'package:flutter/material.dart';

/// Mirrors apps/web/src/app/(consumer)/certificates/[certificateId]/page.tsx
class CertificateDetailScreen extends StatelessWidget {
  final String certificateId;
  const CertificateDetailScreen({super.key, required this.certificateId});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Certificate $certificateId')),
      body: Center(child: Text('TODO: render certificate + QR + download/share, mirrors CertificateDocument.tsx')),
    );
  }
}
