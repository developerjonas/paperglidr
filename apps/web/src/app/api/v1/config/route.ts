import { apiJson, v1Route } from "@/lib/api/v1"
import { getEnabledGateways } from "@/services/payments/config"
import { POLICY_TERMS } from "@/config/policyTerms"
import { COMPANY } from "@/config/company"
import { SITE_NAME, SITE_URL } from "@/lib/site"

/**
 * What the app needs before it renders a checkout or a policy screen: the
 * payment methods this deployment accepts, and the policy numbers the code
 * enforces. Public.
 */
export const GET = v1Route("config", async () =>
  apiJson({
    siteName: SITE_NAME,
    siteUrl: SITE_URL,
    supportEmail: COMPANY.supportEmail,
    gateways: getEnabledGateways(),
    policy: POLICY_TERMS,
  }),
)
