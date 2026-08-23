// lib/features/support/data/support_ticket.dart
import 'ticket_enums.dart';

class SupportTicket {
  final String id;
  final String subject;
  final TicketCategory category;
  final TicketStatus status;
  final DateTime lastMessageAt;
  final DateTime createdAt;

  SupportTicket({
    required this.id,
    required this.subject,
    required this.category,
    required this.status,
    required this.lastMessageAt,
    required this.createdAt,
  });

  factory SupportTicket.fromJson(Map<String, dynamic> json) {
    return SupportTicket(
      id: json['id'] as String,
      subject: json['subject'] as String? ?? '',
      category: categoryFromString(json['category'] as String?),
      status: statusFromString(json['status'] as String?),
      lastMessageAt: DateTime.tryParse(json['lastMessageAt'] as String? ?? '') ?? DateTime.now(),
      createdAt: DateTime.tryParse(json['createdAt'] as String? ?? '') ?? DateTime.now(),
    );
  }
}