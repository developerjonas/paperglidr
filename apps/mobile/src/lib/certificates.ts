// The website's format (certificateCodeSchema): CERT- and 10 letters/digits.
const CODE = /^CERT-[A-Z0-9]{10}$/;

/**
 * A certificate code from what was scanned or typed: the QR's verify link
 * (…/verify/CERT-XXXXXXXXXX) or the code itself. Null if it isn't one.
 */
export function parseCertificateCode(input: string): string | null {
  const text = input.trim();
  const fromUrl = text.match(/\/verify\/([A-Za-z0-9-]+)\/?(?:[?#].*)?$/)?.[1];
  const code = (fromUrl ?? text).toUpperCase();
  return CODE.test(code) ? code : null;
}

/** The link a certificate's QR code holds (as on the website). */
export function verifyUrl(siteUrl: string, code: string) {
  return `${siteUrl}/verify/${code}`;
}
