// lib/features/certificates/screens/certificate_detail_screen.dart
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'package:url_launcher/url_launcher.dart';
import '../data/certificate.dart';
import '../data/certificates_api.dart';
import '../data/verify_url.dart';
import '../../../shared/widgets/empty_state.dart';
import '../../../shared/widgets/loading_indicator.dart';

/// Mirrors apps/web/src/app/(consumer)/certificates/[certificateId]/page.tsx
/// The full certificate document (CertificateDocument.tsx) stays a web
/// thing — mobile shows the snapshot data + a QR/link out to the public
/// verify page rather than reproducing that rendering natively.
class CertificateDetailScreen extends StatefulWidget {
  final String certificateId;
  const CertificateDetailScreen({super.key, required this.certificateId});

  @override
  State<CertificateDetailScreen> createState() => _CertificateDetailScreenState();
}

class _CertificateDetailScreenState extends State<CertificateDetailScreen> {
  late Future<Certificate> _future;

  @override
  void initState() {
    super.initState();
    _future = CertificatesApi.fetchCertificate(widget.certificateId);
  }

  Future<void> _openVerifyPage(String certificateCode) async {
    final uri = Uri.parse(verifyUrlFor(certificateCode));
    if (!await launchUrl(uri, mode: LaunchMode.externalApplication)) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Could not open the verify page.')),
      );
    }
  }

  String _formatDuration(int minutes) {
    final h = minutes ~/ 60;
    final m = minutes % 60;
    if (h == 0) return '${m}m';
    if (m == 0) return '${h}h';
    return '${h}h ${m}m';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Certificate')),
      body: FutureBuilder<Certificate>(
        future: _future,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const LoadingIndicator();
          }
          if (snapshot.hasError) {
            return EmptyState(
              icon: Icons.error_outline,
              message: 'Could not load certificate.\n${snapshot.error}',
            );
          }

          final cert = snapshot.data!;
          final verifyUrl = verifyUrlFor(cert.certificateCode);

          return ListView(
            padding: const EdgeInsets.all(20),
            children: [
              if (cert.isRevoked)
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(12),
                  margin: const EdgeInsets.only(bottom: 20),
                  decoration: BoxDecoration(
                    color: Colors.red.shade50,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: Colors.red.shade200),
                  ),
                  child: Row(
                    children: [
                      Icon(Icons.block, color: Colors.red.shade700, size: 20),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          cert.revokedReason ?? 'This certificate has been revoked.',
                          style: TextStyle(color: Colors.red.shade700),
                        ),
                      ),
                    ],
                  ),
                ),
              Icon(
                Icons.workspace_premium,
                size: 64,
                color: cert.isRevoked ? Colors.grey.shade400 : Colors.amber.shade600,
              ),
              const SizedBox(height: 12),
              Text(
                cert.courseTitleSnapshot,
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.headlineSmall,
              ),
              const SizedBox(height: 4),
              Text(
                'Instructor: ${cert.instructorNameSnapshot}',
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.bodyMedium,
              ),
              const SizedBox(height: 4),
              Text(
                '${_formatDuration(cert.courseDurationMinutesSnapshot)} course',
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.bodySmall,
              ),
              const SizedBox(height: 6),
              Text(
                'Issued ${DateFormat.yMMMMd().format(cert.issuedAt)}',
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.bodyMedium,
              ),
              if (!cert.isRevoked) ...[
                const SizedBox(height: 28),
                Center(
                  child: Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      border: Border.all(color: Theme.of(context).dividerColor),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: QrImageView(data: verifyUrl, size: 180),
                  ),
                ),
                const SizedBox(height: 8),
                Center(
                  child: Text('Scan to verify', style: Theme.of(context).textTheme.bodySmall),
                ),
              ],
              const SizedBox(height: 28),
              OutlinedButton.icon(
                onPressed: () => _openVerifyPage(cert.certificateCode),
                icon: const Icon(Icons.open_in_new),
                label: const Text('View full certificate on web'),
              ),
            ],
          );
        },
      ),
    );
  }
}