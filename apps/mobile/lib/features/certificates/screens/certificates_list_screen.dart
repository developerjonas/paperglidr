// lib/features/certificates/screens/certificates_list_screen.dart
import 'package:flutter/material.dart';
import '../data/certificate.dart';
import '../data/certificates_api.dart';
import '../widgets/certificate_card.dart';
import '../../../shared/widgets/empty_state.dart';
import '../../../shared/widgets/loading_indicator.dart';

/// Mirrors apps/web/src/app/(consumer)/certificates/page.tsx
class CertificatesListScreen extends StatefulWidget {
  const CertificatesListScreen({super.key});

  @override
  State<CertificatesListScreen> createState() => _CertificatesListScreenState();
}

class _CertificatesListScreenState extends State<CertificatesListScreen> {
  late Future<List<Certificate>> _future;

  @override
  void initState() {
    super.initState();
    _future = CertificatesApi.fetchMyCertificates();
  }

  Future<void> _refresh() async {
    final next = CertificatesApi.fetchMyCertificates();
    setState(() => _future = next);
    await next;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Certificates')),
      body: RefreshIndicator(
        onRefresh: _refresh,
        child: FutureBuilder<List<Certificate>>(
          future: _future,
          builder: (context, snapshot) {
            if (snapshot.connectionState == ConnectionState.waiting) {
              return const LoadingIndicator();
            }
            if (snapshot.hasError) {
              return ListView(
                children: [
                  const SizedBox(height: 80),
                  EmptyState(
                    icon: Icons.error_outline,
                    message: 'Could not load certificates.\n${snapshot.error}',
                  ),
                ],
              );
            }
            final certs = snapshot.data ?? [];
            if (certs.isEmpty) {
              return ListView(
                children: const [
                  SizedBox(height: 80),
                  EmptyState(
                    icon: Icons.workspace_premium_outlined,
                    message: 'Complete a course to earn your first certificate.',
                  ),
                ],
              );
            }
            return ListView.separated(
              padding: const EdgeInsets.all(12),
              itemCount: certs.length,
              separatorBuilder: (_, __) => const SizedBox(height: 8),
              itemBuilder: (context, i) => CertificateCard(certificate: certs[i]),
            );
          },
        ),
      ),
    );
  }
}