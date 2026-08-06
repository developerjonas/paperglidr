import QRCode from "qrcode"

export async function generateCertificateQrSvg(verificationUrl: string) {
  return QRCode.toString(verificationUrl, {
    type: "svg",
    margin: 1,
    color: { dark: "#000000", light: "#00000000" }, // transparent background, matches light/dark theme
    width: 160,
  })
}
