import { apiJson, v1Route } from "@/lib/api/v1"
import { getEnabledGateways } from "@/services/payments/config"
import { POLICY_TERMS } from "@/config/policyTerms"
import {
  COMPANY,
  LEGAL_LAST_UPDATED,
  companyPanDisplay,
  companyRegistrationDisplay,
} from "@/config/company"
import { LEGAL_PAGES } from "@/config/legalPages"
import { SITE_NAME, SITE_URL } from "@/lib/site"

/**
 * What the app needs before it renders a checkout, policy or contact
 * screen: the payment methods this deployment accepts, the policy numbers
 * the code enforces, the policy pages (the app opens them on the website —
 * the only copy of the legal text) and the company details. Public.
 */
export const GET = v1Route("config", async () =>
  apiJson({
    siteName: SITE_NAME,
    siteUrl: SITE_URL,
    supportEmail: COMPANY.supportEmail,
    gateways: getEnabledGateways(),
    policy: POLICY_TERMS,
    legal: {
      lastUpdated: LEGAL_LAST_UPDATED,
      pages: LEGAL_PAGES.map(({ href, title, summary }) => ({ path: href, title, summary })),
    },
    company: {
      brandName: COMPANY.brandName,
      legalName: COMPANY.legalName,
      registeredAddress: COMPANY.registeredAddress,
      registration: companyRegistrationDisplay,
      pan: companyPanDisplay,
      supportEmail: COMPANY.supportEmail,
      legalEmail: COMPANY.legalEmail,
    },
  }),
)
