import crypto from "crypto";

const OTP_LENGTH = 6;
const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const MAX_ATTEMPTS = 5;

export function generateOtpCode(): string {
  // Cryptographically random digits, not Math.random() — this gates
  // publishing rights, worth the slightly stricter source of randomness.
  const bytes = crypto.randomInt(0, 10 ** OTP_LENGTH);
  return bytes.toString().padStart(OTP_LENGTH, "0");
}

export function hashOtpCode(code: string): string {
  return crypto.createHash("sha256").update(code).digest("hex");
}

export function getOtpExpiry(): Date {
  return new Date(Date.now() + OTP_TTL_MS);
}

export { MAX_ATTEMPTS };
