import { env } from "@/data/env/server"

const SMSPASAL_URL = "https://sms.smspasal.com/smsapi/index.php"

export type SendSmsResult =
  | { success: true; shootId: string }
  | { success: false; error: string }

// GET request per SMSPasal's docs (supports both GET and POST — using GET
// since there's no request body concern with a single short text message).
// responsetype=http means the response is a plain string, not JSON/XML:
// "ERR: {message}" on failure, "SMS-SHOOT-ID/{id}" on success.
export async function sendSms(params: {
  phoneNumber: string
  message: string
}): Promise<SendSmsResult> {
  if (!env.SMSPASAL_API_KEY || !env.SMSPASAL_SENDER_ID) {
    return { success: false, error: "SMS gateway not configured" }
  }

  // SMSPasal's docs sample used bare 10-digit numbers with no country
  // code ('984XXXXXX'), while we store/validate as +977XXXXXXXXXX for a
  // consistent, unambiguous format. Strip the prefix only at the point
  // of the actual gateway call.
  const gatewayNumber = params.phoneNumber.replace(/^\+977/, "")

  const url = new URL(SMSPASAL_URL)
  url.searchParams.set("key", env.SMSPASAL_API_KEY)
  url.searchParams.set("campaign", env.SMSPASAL_CAMPAIGN_ID ?? "")
  url.searchParams.set("routeid", env.SMSPASAL_ROUTE_ID ?? "")
  url.searchParams.set("type", "text")
  url.searchParams.set("responsetype", "http")
  url.searchParams.set("contacts", gatewayNumber)
  url.searchParams.set("senderid", env.SMSPASAL_SENDER_ID)
  url.searchParams.set("msg", params.message)

  const response = await fetch(url.toString())
  const body = (await response.text()).trim()

  if (body.startsWith("ERR:")) {
    return { success: false, error: body.slice(4).trim() }
  }
  if (body.startsWith("SMS-SHOOT-ID/")) {
    return { success: true, shootId: body.split("/")[1] ?? "" }
  }

  return { success: false, error: `Unexpected gateway response: ${body}` }
}
