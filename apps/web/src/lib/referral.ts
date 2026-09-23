// Creator referral attribution (?ref=<instructor handle>). Shared by the
// middleware (sets the cookie) and the purchase flow (reads it); the
// window is also stated in the creator terms via config/policyTerms.ts.
export const REF_COOKIE = "pg_ref"
export const REF_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30 // 30 days
