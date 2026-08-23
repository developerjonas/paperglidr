// lib/features/support/widgets/ticket_status_chip.dart
import 'package:flutter/material.dart';
import '../data/ticket_enums.dart';

class TicketStatusChip extends StatelessWidget {
  final TicketStatus status;
  const TicketStatusChip({super.key, required this.status});

  @override
  Widget build(BuildContext context) {
    final color = switch (status) {
      TicketStatus.open => Colors.blue,
      TicketStatus.inProgress => Colors.orange,
      TicketStatus.resolved => Colors.green,
      TicketStatus.closed => Colors.grey,
    };

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(
        statusLabel(status),
        style: TextStyle(color: color, fontSize: 12, fontWeight: FontWeight.w600),
      ),
    );
  }
}