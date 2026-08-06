import { getCourseTag, getGlobalTag, getIdTag, getUserTag } from "@/lib/dataCache"
import { revalidateTag } from "next/cache"

export function getCertificateGlobalTag() {
  return getGlobalTag("certificates")
}
export function getCertificateIdTag(id: string) {
  return getIdTag("certificates", id)
}
export function getCertificateUserTag(userId: string) {
  return getUserTag("certificates", userId)
}
export function getCertificateCourseTag(courseId: string) {
  return getCourseTag("certificates", courseId)
}

export function revalidateCertificateCache({
  id,
  userId,
  courseId,
}: {
  id: string
  userId: string
  courseId: string
}) {
  revalidateTag(getCertificateGlobalTag())
  revalidateTag(getCertificateIdTag(id))
  revalidateTag(getCertificateUserTag(userId))
  revalidateTag(getCertificateCourseTag(courseId))
}
