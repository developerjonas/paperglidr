// lib/features/support/screens/new_support_ticket_screen.dart
import 'package:flutter/material.dart';
import '../data/support_api.dart';
import '../data/ticket_enums.dart';

/// Mirrors apps/web/src/app/(consumer)/support/new/page.tsx
class NewSupportTicketScreen extends StatefulWidget {
  const NewSupportTicketScreen({super.key});

  @override
  State<NewSupportTicketScreen> createState() => _NewSupportTicketScreenState();
}

class _NewSupportTicketScreenState extends State<NewSupportTicketScreen> {
  final _formKey = GlobalKey<FormState>();
  final _subjectController = TextEditingController();
  final _messageController = TextEditingController();
  TicketCategory _category = TicketCategory.other;
  bool _submitting = false;
  String? _error;

  @override
  void dispose() {
    _subjectController.dispose();
    _messageController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() {
      _submitting = true;
      _error = null;
    });
    try {
      await SupportApi.createTicket(
        subject: _subjectController.text.trim(),
        category: _category,
        message: _messageController.text.trim(),
      );
      if (mounted) Navigator.of(context).pop(true); // signal SupportListScreen to refresh
    } catch (e) {
      setState(() => _error = '$e');
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('New Ticket')),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: ListView(
            children: [
              TextFormField(
                controller: _subjectController,
                decoration: const InputDecoration(labelText: 'Subject'),
                validator: (v) => (v == null || v.trim().isEmpty) ? 'Enter a subject' : null,
              ),
              const SizedBox(height: 12),
              DropdownButtonFormField<TicketCategory>(
                initialValue: _category,
                decoration: const InputDecoration(labelText: 'Category'),
                items: TicketCategory.values
                    .map((c) => DropdownMenuItem(value: c, child: Text(categoryLabel(c))))
                    .toList(),
                onChanged: (v) => setState(() => _category = v ?? TicketCategory.other),
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _messageController,
                decoration: const InputDecoration(labelText: 'Message', alignLabelWithHint: true),
                maxLines: 6,
                validator: (v) => (v == null || v.trim().isEmpty) ? 'Describe your issue' : null,
              ),
              const SizedBox(height: 20),
              if (_error != null)
                Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: Text(_error!, style: const TextStyle(color: Colors.red)),
                ),
              FilledButton(
                onPressed: _submitting ? null : _submit,
                child: _submitting
                    ? const SizedBox(height: 16, width: 16, child: CircularProgressIndicator(strokeWidth: 2))
                    : const Text('Submit'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}