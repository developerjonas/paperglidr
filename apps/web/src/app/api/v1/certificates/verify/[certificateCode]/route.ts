import { apiError, apiJson, v1Route } from "@/lib/api/v1"
import { getCertificateVerificationByCode } from "@/features/certificates/db/certificates"

// Public: what the /verify page shows for the code in a certificate's QR.
export const GET = v1Route<{ certificateCode: string }>("verify certificate", async (_req, { params }) => {
  const { certificateCode } = await params
  const certificate = await getCertificateVerificationByCode(certificateCode)
  if (!certificate) return apiError(404, "Certificate not found")
  return apiJson(certificate)
})
