// lib/features/support/data/ticket_enums.dart
enum TicketCategory { account, billing, technical, instructor, other }
enum TicketStatus { open, inProgress, resolved, closed }

TicketCategory categoryFromString(String? s) {
  switch (s) {
    case 'account': return TicketCategory.account;
    case 'billing': return TicketCategory.billing;
    case 'technical': return TicketCategory.technical;
    case 'instructor': return TicketCategory.instructor;
    default: return TicketCategory.other;
  }
}

String categoryToString(TicketCategory c) => switch (c) {
      TicketCategory.account => 'account',
      TicketCategory.billing => 'billing',
      TicketCategory.technical => 'technical',
      TicketCategory.instructor => 'instructor',
      TicketCategory.other => 'other',
    };

String categoryLabel(TicketCategory c) => switch (c) {
      TicketCategory.account => 'Account',
      TicketCategory.billing => 'Billing',
      TicketCategory.technical => 'Technical',
      TicketCategory.instructor => 'Instructor',
      TicketCategory.other => 'Other',
    };

TicketStatus statusFromString(String? s) {
  switch (s) {
    case 'open': return TicketStatus.open;
    case 'in_progress': return TicketStatus.inProgress;
    case 'resolved': return TicketStatus.resolved;
    case 'closed': return TicketStatus.closed;
    default: return TicketStatus.open;
  }
}

String statusLabel(TicketStatus s) => switch (s) {
      TicketStatus.open => 'Open',
      TicketStatus.inProgress => 'In Progress',
      TicketStatus.resolved => 'Resolved',
      TicketStatus.closed => 'Closed',
    };