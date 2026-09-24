// The refund rule's numbers, with no database imports, so the policy pages
// (config/policyTerms.ts) and the payout hold (features/payouts) read the
// same values the refund check enforces.

// Exactly 7 * 24 * 60 * 60 * 1000ms. Deliberately NOT "start of day" or
// calendar-day math — 1ms past this and the request is outside the window.
export const REFUND_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

// Strictly under 20%, not "20% or less".
export const REFUND_COMPLETION_THRESHOLD_PERCENT = 20;
