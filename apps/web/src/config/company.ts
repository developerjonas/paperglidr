/**
 * Every company detail shown on the legal pages and in the footer.
 * Filling in the registration number or PAN later is a one-line change here.
 */
export const COMPANY = {
  brandName: "Chiyali",
  legalName: "Chiyali Technology Pvt. Ltd.",
  registeredAddress: "Lalitpur Metropolitan City, Ward No. 22, Lalitpur, Nepal",
  website: "https://chiyali.com",
  // Office of the Company Registrar registration number — null until issued.
  registrationNumber: null as string | null,
  // Permanent Account Number from the Inland Revenue Department — null until issued.
  pan: null as string | null,
  supportEmail: "support@chiyali.com",
  legalEmail: "legal@chiyali.com",
} as const

/** One date for every policy page. Update it whenever any policy changes. */
export const LEGAL_LAST_UPDATED = "23 September 2026"

/** Shown instead of a number until it is issued — never a fake number. */
export const REGISTRATION_PENDING = "Registration in progress"

export const companyRegistrationDisplay =
  COMPANY.registrationNumber ?? REGISTRATION_PENDING
export const companyPanDisplay = COMPANY.pan ?? REGISTRATION_PENDING
