"use server"
import { getCurrentUser } from "@/services/auth"
import { canRevokeCertificate, canViewCertificate } from "../permissions/certificates"
import {
  getCertificate,
  getCertificateByCode,
  revokeCertificate as revokeCertificateDb,
} from "../db/certificates"
import { revokeCertificateSchema } from "../schemas/certificates"

export async function getCertificateForViewing(certificateId: string) {
  const user = await getCurrentUser()
  const certificate = await getCertificate(certificateId)
  if (certificate == null) {
    return { error: true, message: "Certificate not found", certificate: null }
  }
  if (!(await canViewCertificate(user, certificateId))) {
    return { error: true, message: "You don't have permission to view this certificate", certificate: null }
  }
  return { error: false, message: "", certificate }
}

// Public — no auth check. This is the whole point: an employer with no account
// can hit this and get a straight answer.
export async function getCertificateForVerification(certificateCode: string) {
  const certificate = await getCertificateByCode(certificateCode)
  if (certificate == null) {
    return { error: true, message: "No certificate found with this code", certificate: null }
  }
  return { error: false, message: "", certificate }
}

export async function revokeCertificate(id: string, unsafeData: { reason: string }) {
  const user = await getCurrentUser()
  if (!canRevokeCertificate(user)) {
    return { error: true, message: "You don't have permission to revoke certificates" }
  }
  const { success, data } = revokeCertificateSchema.safeParse(unsafeData)
  if (!success) {
    return { error: true, message: "A reason is required" }
  }
  await revokeCertificateDb({ id, reason: data.reason })
  return { error: false, message: "Certificate revoked" }
}
