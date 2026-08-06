import { generateCertificateQrSvg } from "../lib/qrcode"

export async function CertificateQRCode({ certificateCode }: { certificateCode: string }) {
  const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/verify/${certificateCode}`
  const svg = await generateCertificateQrSvg(verificationUrl)

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="w-24 h-24 [&>svg]:w-full [&>svg]:h-full" dangerouslySetInnerHTML={{ __html: svg }} />
      <span className="text-[10px] text-muted-foreground">Scan to verify</span>
    </div>
  )
}
