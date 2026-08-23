// lib/features/support/data/ticket_detail.dart
import 'ticket_enums.dart';
import 'ticket_message.dart';

class TicketDetail {
  final String id;
  final String subject;
  final TicketCategory category;
  final TicketStatus status;
  final List<TicketMessage> messages;

  TicketDetail({
    required this.id,
    required this.subject,
    required this.category,
    required this.status,
    required this.messages,
  });

  factory TicketDetail.fromJson(Map<String, dynamic> json) {
    return TicketDetail(
      id: json['id'] as String,
      subject: json['subject'] as String? ?? '',
      category: categoryFromString(json['category'] as String?),
      status: statusFromString(json['status'] as String?),
      messages: (json['messages'] as List<dynamic>? ?? [])
          .map((e) => TicketMessage.fromJson(e as Map<String, dynamic>))
          .toList(),
    );
  }
}