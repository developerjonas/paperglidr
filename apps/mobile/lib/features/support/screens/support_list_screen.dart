// lib/features/support/screens/support_list_screen.dart
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../data/support_ticket.dart';
import '../data/support_api.dart';
import '../widgets/ticket_status_chip.dart';
import '../../../shared/widgets/empty_state.dart';
import '../../../shared/widgets/loading_indicator.dart';

/// Mirrors apps/web/src/app/(consumer)/support/page.tsx
class SupportListScreen extends StatefulWidget {
  const SupportListScreen({super.key});

  @override
  State<SupportListScreen> createState() => _SupportListScreenState();
}

class _SupportListScreenState extends State<SupportListScreen> {
  late Future<List<SupportTicket>> _future;

  @override
  void initState() {
    super.initState();
    _future = SupportApi.fetchMyTickets();
  }

  Future<void> _refresh() async {
    final next = SupportApi.fetchMyTickets();
    setState(() => _future = next);
    await next;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Support')),
      floatingActionButton: FloatingActionButton(
        onPressed: () async {
          final created = await context.push<bool>('/support/new');
          if (created == true) _refresh();
        },
        child: const Icon(Icons.add),
      ),
      body: RefreshIndicator(
        onRefresh: _refresh,
        child: FutureBuilder<List<SupportTicket>>(
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
                    message: 'Could not load tickets.\n${snapshot.error}',
                  ),
                ],
              );
            }
            final tickets = snapshot.data ?? [];
            if (tickets.isEmpty) {
              return ListView(
                children: const [
                  SizedBox(height: 80),
                  EmptyState(
                    icon: Icons.support_agent_outlined,
                    message: 'No support tickets yet. Tap + to open one.',
                  ),
                ],
              );
            }
            return ListView.separated(
              padding: const EdgeInsets.fromLTRB(12, 12, 12, 80),
              itemCount: tickets.length,
              separatorBuilder: (_, __) => const SizedBox(height: 8),
              itemBuilder: (context, i) {
                final t = tickets[i];
                return Card(
                  child: ListTile(
                    title: Text(t.subject, maxLines: 1, overflow: TextOverflow.ellipsis),
                    subtitle: Text('Updated ${DateFormat.yMMMd().add_jm().format(t.lastMessageAt)}'),
                    trailing: TicketStatusChip(status: t.status),
                    onTap: () => context.push('/support/${t.id}'),
                  ),
                );
              },
            );
          },
        ),
      ),
    );
  }
}