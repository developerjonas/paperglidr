import 'package:flutter/material.dart';

/// Mirrors apps/web/src/app/(consumer)/support/new/page.tsx
class NewSupportTicketScreen extends StatelessWidget {
  const NewSupportTicketScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('New Ticket')),
      body: const Center(child: Text('TODO: form, mirrors SupportTicketForm.tsx')),
    );
  }
}
