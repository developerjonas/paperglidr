import 'package:flutter/material.dart';

/// Mirrors apps/web/src/app/(consumer)/support/support/[ticketId]/page.tsx
class SupportTicketDetailScreen extends StatelessWidget {
  final String ticketId;
  const SupportTicketDetailScreen({super.key, required this.ticketId});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Ticket $ticketId')),
      body: Center(child: Text('TODO: thread view, mirrors SupportTicketThread.tsx')),
    );
  }
}
