// lib/features/support/data/ticket_message.dart
class TicketMessage {
  final String id;
  final String authorId;
  final bool isAdminReply;
  final String content;
  final DateTime createdAt;

  TicketMessage({
    required this.id,
    required this.authorId,
    required this.isAdminReply,
    required this.content,
    required this.createdAt,
  });

  factory TicketMessage.fromJson(Map<String, dynamic> json) {
    return TicketMessage(
      id: json['id'] as String,
      authorId: json['authorId'] as String? ?? '',
      isAdminReply: json['isAdminReply'] as bool? ?? false,
      content: json['content'] as String? ?? '',
      createdAt: DateTime.tryParse(json['createdAt'] as String? ?? '') ?? DateTime.now(),
    );
  }
}