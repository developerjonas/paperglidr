// lib/features/support/data/support_api.dart
import 'dart:convert';
import '../../../core/api_client.dart';
import '../../../core/api_paths.dart';
import 'support_ticket.dart';
import 'ticket_detail.dart';
import 'ticket_enums.dart';

class SupportApi {
  static Future<List<SupportTicket>> fetchMyTickets() async {
    final res = await ApiClient.instance.get('$kApiV1/support');
    if (res.statusCode != 200) {
      throw Exception('Failed to load tickets (${res.statusCode})');
    }
    final list = jsonDecode(res.body) as List<dynamic>;
    return list.map((e) => SupportTicket.fromJson(e as Map<String, dynamic>)).toList();
  }

  static Future<TicketDetail> fetchTicket(String ticketId) async {
    final res = await ApiClient.instance.get('$kApiV1/support/$ticketId');
    if (res.statusCode == 404) throw Exception('Ticket not found');
    if (res.statusCode != 200) throw Exception('Failed to load ticket (${res.statusCode})');
    return TicketDetail.fromJson(jsonDecode(res.body) as Map<String, dynamic>);
  }

  static Future<void> createTicket({
    required String subject,
    required TicketCategory category,
    required String message,
  }) async {
    final res = await ApiClient.instance.post(
      '$kApiV1/support',
      body: {
        'subject': subject,
        'category': categoryToString(category),
        'message': message,
      },
    );
    if (res.statusCode != 201) {
      throw Exception('Failed to create ticket (${res.statusCode})');
    }
  }

  static Future<void> reply(String ticketId, String content) async {
    final res = await ApiClient.instance.post(
      '$kApiV1/support/$ticketId/messages',
      body: {'content': content},
    );
    if (res.statusCode != 201) {
      throw Exception('Failed to send reply (${res.statusCode})');
    }
  }
}