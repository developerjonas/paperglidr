// lib/features/purchases/widgets/purchase_status_chip.dart
import 'package:flutter/material.dart';
import '../data/purchase.dart';

class PurchaseStatusChip extends StatelessWidget {
  final PurchaseStatus status;
  const PurchaseStatusChip({super.key, required this.status});

  @override
  Widget build(BuildContext context) {
    final (label, color) = switch (status) {
      PurchaseStatus.completed => ('Completed', Colors.green),
      PurchaseStatus.pending => ('Pending', Colors.orange),
      PurchaseStatus.failed => ('Failed', Colors.red),
      PurchaseStatus.unknown => ('Unknown', Colors.grey),
    };

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(label, style: TextStyle(color: color, fontSize: 12, fontWeight: FontWeight.w600)),
    );
  }
}