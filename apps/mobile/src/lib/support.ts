import type { TicketCategory, TicketStatus } from '@/api/types';

// The website's labels (SupportTicketForm, AdminTicketStatusSelect).
export const CATEGORY_LABELS: Record<TicketCategory, string> = {
  account: 'Account',
  billing: 'Billing & Payments',
  technical: 'Technical Issue',
  instructor: 'Instructor / Teaching',
  other: 'Other',
};

export const STATUS_LABELS: Record<TicketStatus, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  closed: 'Closed',
};
