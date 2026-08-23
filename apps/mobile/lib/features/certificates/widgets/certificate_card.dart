// lib/features/certificates/widgets/certificate_card.dart
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../data/certificate.dart';

class CertificateCard extends StatelessWidget {
  final Certificate certificate;
  const CertificateCard({super.key, required this.certificate});

  @override
  Widget build(BuildContext context) {
    return Card(
      clipBehavior: Clip.antiAlias,
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: certificate.isRevoked
              ? Colors.grey.shade300
              : Colors.amber.shade100,
          child: Icon(
            certificate.isRevoked ? Icons.block : Icons.workspace_premium_outlined,
            color: certificate.isRevoked ? Colors.grey.shade600 : Colors.amber.shade800,
          ),
        ),
        title: Text(
          certificate.courseTitleSnapshot,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: certificate.isRevoked
              ? const TextStyle(decoration: TextDecoration.lineThrough)
              : null,
        ),
        subtitle: Text(
          certificate.isRevoked
              ? 'Revoked'
              : 'Issued ${DateFormat.yMMMd().format(certificate.issuedAt)}',
          style: certificate.isRevoked ? TextStyle(color: Colors.red.shade700) : null,
        ),
        trailing: const Icon(Icons.chevron_right, size: 20),
        onTap: () => context.push('/certificates/${certificate.id}'),
      ),
    );
  }
}