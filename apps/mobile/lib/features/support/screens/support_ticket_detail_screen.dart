// lib/features/support/screens/support_ticket_detail_screen.dart
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../data/ticket_detail.dart';
import '../data/ticket_message.dart';
import '../data/support_api.dart';
import '../widgets/ticket_status_chip.dart';
import '../../../core/auth/auth_state.dart';
import '../../../shared/widgets/empty_state.dart';
import '../../../shared/widgets/loading_indicator.dart';

/// Mirrors apps/web/src/app/(consumer)/support/support/[ticketId]/page.tsx
class SupportTicketDetailScreen extends StatefulWidget {
  final String ticketId;
  const SupportTicketDetailScreen({super.key, required this.ticketId});

  @override
  State<SupportTicketDetailScreen> createState() => _SupportTicketDetailScreenState();
}

class _SupportTicketDetailScreenState extends State<SupportTicketDetailScreen> {
  late Future<TicketDetail> _future;
  final _replyController = TextEditingController();
  bool _sending = false;

  @override
  void initState() {
    super.initState();
    _future = SupportApi.fetchTicket(widget.ticketId);
  }

  @override
  void dispose() {
    _replyController.dispose();
    super.dispose();
  }

  Future<void> _send() async {
    final text = _replyController.text.trim();
    if (text.isEmpty || _sending) return;
    setState(() => _sending = true);
    try {
      await SupportApi.reply(widget.ticketId, text);
      _replyController.clear();
      setState(() => _future = SupportApi.fetchTicket(widget.ticketId));
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
      }
    } finally {
      if (mounted) setState(() => _sending = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final myUserId = context.watch<AuthState>().user?.id;

    return Scaffold(
      appBar: AppBar(title: const Text('Ticket')),
      body: FutureBuilder<TicketDetail>(
        future: _future,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const LoadingIndicator();
          }
          if (snapshot.hasError) {
            return EmptyState(
              icon: Icons.error_outline,
              message: 'Could not load ticket.\n${snapshot.error}',
            );
          }

          final ticket = snapshot.data!;
          final closed = ticket.status.name == 'closed';

          return Column(
            children: [
              Padding(
                padding: const EdgeInsets.all(16),
                child: Row(
                  children: [
                    Expanded(
                      child: Text(ticket.subject, style: Theme.of(context).textTheme.titleMedium),
                    ),
                    TicketStatusChip(status: ticket.status),
                  ],
                ),
              ),
              const Divider(height: 1),
              Expanded(
                child: ListView.builder(
                  padding: const EdgeInsets.all(12),
                  itemCount: ticket.messages.length,
                  itemBuilder: (context, i) {
                    final m = ticket.messages[i];
                    final isMine = m.authorId == myUserId && !m.isAdminReply;
                    return _MessageBubble(message: m, isMine: isMine);
                  },
                ),
              ),
              if (closed)
                const Padding(
                  padding: EdgeInsets.all(16),
                  child: Text(
                    'This ticket is closed.',
                    style: TextStyle(color: Colors.grey),
                  ),
                )
              else
                SafeArea(
                  top: false,
                  child: Padding(
                    padding: const EdgeInsets.all(12),
                    child: Row(
                      children: [
                        Expanded(
                          child: TextField(
                            controller: _replyController,
                            decoration: const InputDecoration(
                              hintText: 'Type a reply…',
                              border: OutlineInputBorder(),
                              isDense: true,
                            ),
                            minLines: 1,
                            maxLines: 4,
                          ),
                        ),
                        const SizedBox(width: 8),
                        IconButton.filled(
                          onPressed: _sending ? null : _send,
                          icon: _sending
                              ? const SizedBox(
                                  height: 16, width: 16,
                                  child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                                )
                              : const Icon(Icons.send),
                        ),
                      ],
                    ),
                  ),
                ),
            ],
          );
        },
      ),
    );
  }
}

class _MessageBubble extends StatelessWidget {
  final TicketMessage message;
  final bool isMine;
  const _MessageBubble({required this.message, required this.isMine});

  @override
  Widget build(BuildContext context) {
    final bg = isMine
        ? Theme.of(context).colorScheme.primaryContainer
        : Theme.of(context).colorScheme.surfaceContainerHighest;

    return Align(
      alignment: isMine ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.symmetric(vertical: 4),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.75),
        decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(12)),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (message.isAdminReply)
              const Padding(
                padding: EdgeInsets.only(bottom: 2),
                child: Text('Support', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
              ),
            Text(message.content),
            const SizedBox(height: 2),
            Text(
              DateFormat.jm().format(message.createdAt),
              style: const TextStyle(fontSize: 10, color: Colors.grey),
            ),
          ],
        ),
      ),
    );
  }
}