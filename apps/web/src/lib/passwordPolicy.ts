/**
 * The password rules — one module for the sign-up form (live checklist and
 * generator) and the server (lib/auth.ts rejects anything that fails).
 * Breached passwords are also rejected server-side by the haveIBeenPwned
 * plugin; that check can't run in the browser.
 */

export const PASSWORD_MIN_LENGTH = 12
export const PASSWORD_MAX_LENGTH = 128

/**
 * Safari's `passwordrules` attribute: its generated passwords (and iCloud
 * Keychain's) will satisfy these rules.
 */
export const PASSWORD_RULES_ATTRIBUTE = `minlength: ${PASSWORD_MIN_LENGTH}; maxlength: ${PASSWORD_MAX_LENGTH}; required: lower; required: upper; required: digit; required: special;`

// Words that make a password guessable however they're decorated.
const COMMON_FRAGMENTS = [
  "password", "passw0rd", "qwerty", "asdf", "zxcv", "letmein", "welcome",
  "admin", "login", "iloveyou", "monkey", "dragon", "football", "sunshine",
  "princess", "chiyali", "nepal", "kathmandu", "abc123", "123456", "111111", "sushanti"
]

export type PasswordContext = { name?: string; email?: string; username?: string }

// label: the checklist line. fix: what to do, for an error message.
export type PasswordCheck = { id: string; label: string; fix: string; ok: boolean }

function personalParts({ name, email, username }: PasswordContext) {
  return [
    ...(name ?? "").toLowerCase().split(/\s+/),
    (username ?? "").toLowerCase(),
    (email ?? "").toLowerCase().split("@")[0] ?? "",
  ].filter(part => part.length >= 3)
}

function hasSequence(password: string) {
  const lower = password.toLowerCase()
  for (let i = 0; i + 3 < lower.length; i++) {
    const codes = [...lower.slice(i, i + 4)].map(c => c.charCodeAt(0))
    const up = codes.every((c, j) => j === 0 || c === codes[j - 1]! + 1)
    const down = codes.every((c, j) => j === 0 || c === codes[j - 1]! - 1)
    if (up || down) return true
  }
  return false
}

export function checkPassword(password: string, context: PasswordContext = {}) {
  const lower = password.toLowerCase()
  const checks: PasswordCheck[] = [
    { id: "length", label: `At least ${PASSWORD_MIN_LENGTH} characters`, fix: `use ${PASSWORD_MIN_LENGTH} to ${PASSWORD_MAX_LENGTH} characters`, ok: password.length >= PASSWORD_MIN_LENGTH && password.length <= PASSWORD_MAX_LENGTH },
    { id: "lower", label: "A lowercase letter", fix: "add a lowercase letter", ok: /[a-z]/.test(password) },
    { id: "upper", label: "An uppercase letter", fix: "add an uppercase letter", ok: /[A-Z]/.test(password) },
    { id: "digit", label: "A number", fix: "add a number", ok: /[0-9]/.test(password) },
    { id: "symbol", label: "A symbol, like ! # $ % & *", fix: "add a symbol, like ! # $ % & *", ok: /[^A-Za-z0-9]/.test(password) },
    {
      id: "personal",
      label: "Doesn't contain your name, username or email",
      fix: "leave out your name, username and email",
      ok: password.length > 0 && !personalParts(context).some(part => lower.includes(part)),
    },
    {
      id: "pattern",
      label: "No common words, repeats (aaa) or runs (1234, abcd)",
      fix: "avoid common words, repeated characters and runs like 1234 or abcd",
      ok:
        password.length > 0 &&
        !COMMON_FRAGMENTS.some(word => lower.includes(word)) &&
        !/(.)\1\1/.test(password) &&
        !hasSequence(password),
    },
  ]

  const ok = checks.every(check => check.ok)
  const passed = checks.filter(check => check.ok).length
  // 0-4 for the meter. Only a password that passes every rule reaches 3;
  // 16+ characters on top of that is 4.
  const score = !ok
    ? Math.min(2, Math.floor((passed / checks.length) * 3))
    : password.length >= 16
      ? 4
      : 3

  return { ok, score, checks, firstFailure: checks.find(check => !check.ok)?.fix }
}

const LOWER = "abcdefghijkmnopqrstuvwxyz"
const UPPER = "ABCDEFGHJKLMNPQRSTUVWXYZ"
const DIGITS = "23456789"
const SYMBOLS = "!#$%&*+-=?@^_~"

function randomIndex(max: number) {
  const buffer = new Uint32Array(1)
  // Rejection sampling: no modulo bias.
  const limit = Math.floor(0x100000000 / max) * max
  do crypto.getRandomValues(buffer)
  while (buffer[0]! >= limit)
  return buffer[0]! % max
}

/**
 * A random password that satisfies every rule (retries the rare draw that
 * contains a run or a repeat). Look-alike characters (l, 1, O, 0) are left
 * out so it can be read and typed if it ever has to be.
 */
export function generateStrongPassword(length = 20, context: PasswordContext = {}): string {
  const all = LOWER + UPPER + DIGITS + SYMBOLS
  for (;;) {
    const chars = [
      LOWER[randomIndex(LOWER.length)]!,
      UPPER[randomIndex(UPPER.length)]!,
      DIGITS[randomIndex(DIGITS.length)]!,
      SYMBOLS[randomIndex(SYMBOLS.length)]!,
    ]
    while (chars.length < length) chars.push(all[randomIndex(all.length)]!)
    for (let i = chars.length - 1; i > 0; i--) {
      const j = randomIndex(i + 1)
      ;[chars[i], chars[j]] = [chars[j]!, chars[i]!]
    }
    const password = chars.join("")
    if (checkPassword(password, context).ok) return password
  }
}

/** Username rules (the username plugin enforces the same on the server). */
export const USERNAME_MIN_LENGTH = 3
export const USERNAME_MAX_LENGTH = 30
export const USERNAME_PATTERN = /^[a-zA-Z0-9_.]+$/
