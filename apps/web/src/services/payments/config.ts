import "server-only";
import { env } from "@/data/env/server";

export const GATEWAY_NAMES = ["esewa", "khalti", "fonepay"] as const;
export type GatewayName = (typeof GATEWAY_NAMES)[number];
export type PaymentMode = "sandbox" | "live";

export function isGatewayName(value: unknown): value is GatewayName {
  return (
    typeof value === "string" &&
    (GATEWAY_NAMES as readonly string[]).includes(value)
  );
}

/**
 * The ONLY place sandbox values live. Used in `sandbox` mode as fallbacks
 * for anything not set in env; never consulted in `live` mode.
 *
 * eSewa publishes a shared test merchant (EPAYTEST) and its secret key.
 * Khalti and Fonepay have no shared test credentials: in sandbox they are
 * enabled only when their keys are set in env (per-merchant test keys).
 */
export const SANDBOX_DEFAULTS = {
  esewa: {
    productCode: "EPAYTEST",
    secretKey: "8gBm/:&EnhH.1/q",
    formUrl: "https://rc-epay.esewa.com.np/api/epay/main/v2/form",
    statusUrl: "https://rc.esewa.com.np/api/epay/transaction/status/",
  },
  khalti: {
    baseUrl: "https://dev.khalti.com/api/v2",
  },
  fonepay: {
    baseUrl:
      "https://dev-clientapi.fonepay.com/api/merchant/merchantDetailsForThirdParty",
  },
} as const;

// Substrings that must never appear in a live configuration.
const SANDBOX_MARKERS = [
  "rc-epay.esewa.com.np",
  "rc.esewa.com.np",
  "uat.esewa.com.np",
  "dev.khalti.com",
  "dev-clientapi.fonepay.com",
  "EPAYTEST",
  SANDBOX_DEFAULTS.esewa.secretKey,
];

export type EsewaConfig = {
  productCode: string;
  secretKey: string;
  formUrl: string;
  statusUrl: string;
};
export type KhaltiConfig = { secretKey: string; baseUrl: string };
export type FonepayConfig = {
  merchantCode: string;
  secretKey: string;
  username: string;
  password: string;
  baseUrl: string;
};

export type PaymentConfig = {
  mode: PaymentMode;
  esewa: EsewaConfig | null;
  khalti: KhaltiConfig | null;
  fonepay: FonepayConfig | null;
  /** Human-readable reasons a gateway is disabled — for logs/admin only. */
  disabledReasons: Partial<Record<GatewayName, string>>;
};

export type PaymentEnv = {
  PAYMENT_MODE?: string;
  PAYMENT_ENABLED_GATEWAYS?: string;
  ESEWA_PRODUCT_CODE?: string;
  ESEWA_SECRET_KEY?: string;
  ESEWA_FORM_URL?: string;
  ESEWA_STATUS_URL?: string;
  KHALTI_SECRET_KEY?: string;
  KHALTI_BASE_URL?: string;
  FONEPAY_MERCHANT_CODE?: string;
  FONEPAY_SECRET_KEY?: string;
  FONEPAY_USERNAME?: string;
  FONEPAY_PASSWORD?: string;
  FONEPAY_BASE_URL?: string;
};

export class PaymentConfigError extends Error {
  name = "PaymentConfigError";
}

const blank = (value: string | undefined) =>
  value == null || value.trim() === "" ? undefined : value.trim();

/**
 * Pure: env in, config out. Throws PaymentConfigError for a live
 * configuration that contains any sandbox URL or test credential — that is
 * a deploy mistake, not a missing feature, so it must be loud.
 */
export function resolvePaymentConfig(raw: PaymentEnv): PaymentConfig {
  const mode = raw.PAYMENT_MODE;
  if (mode !== "sandbox" && mode !== "live") {
    throw new PaymentConfigError(
      `PAYMENT_MODE must be "sandbox" or "live" (got ${JSON.stringify(mode)})`,
    );
  }
  const live = mode === "live";
  const e = Object.fromEntries(
    Object.entries(raw).map(([key, value]) => [key, blank(value)]),
  ) as PaymentEnv;

  if (live) {
    for (const [key, value] of Object.entries(e)) {
      if (key === "PAYMENT_MODE" || value == null) continue;
      const marker = SANDBOX_MARKERS.find(m => value.includes(m));
      if (marker != null) {
        throw new PaymentConfigError(
          `PAYMENT_MODE=live but ${key} contains a sandbox value (${marker === SANDBOX_DEFAULTS.esewa.secretKey ? "the public eSewa test key" : marker})`,
        );
      }
    }
  }

  // Sandbox: env first, then SANDBOX_DEFAULTS. Live: env only.
  const pick = <T extends string | undefined>(value: T, fallback?: string) =>
    live ? value : (value ?? fallback);

  const disabledReasons: PaymentConfig["disabledReasons"] = {};
  const missing = (gateway: GatewayName, fields: Record<string, unknown>) => {
    const names = Object.entries(fields)
      .filter(([, value]) => value == null)
      .map(([name]) => name);
    if (names.length > 0) {
      disabledReasons[gateway] = `missing ${names.join(", ")}`;
    }
    return names.length > 0;
  };

  const esewaFields = {
    ESEWA_PRODUCT_CODE: pick(e.ESEWA_PRODUCT_CODE, SANDBOX_DEFAULTS.esewa.productCode),
    ESEWA_SECRET_KEY: pick(e.ESEWA_SECRET_KEY, SANDBOX_DEFAULTS.esewa.secretKey),
    ESEWA_FORM_URL: pick(e.ESEWA_FORM_URL, SANDBOX_DEFAULTS.esewa.formUrl),
    ESEWA_STATUS_URL: pick(e.ESEWA_STATUS_URL, SANDBOX_DEFAULTS.esewa.statusUrl),
  };
  const esewa = missing("esewa", esewaFields)
    ? null
    : {
        productCode: esewaFields.ESEWA_PRODUCT_CODE!,
        secretKey: esewaFields.ESEWA_SECRET_KEY!,
        formUrl: esewaFields.ESEWA_FORM_URL!,
        statusUrl: esewaFields.ESEWA_STATUS_URL!,
      };

  const khaltiFields = {
    KHALTI_SECRET_KEY: e.KHALTI_SECRET_KEY, // no shared test key exists
    KHALTI_BASE_URL: pick(e.KHALTI_BASE_URL, SANDBOX_DEFAULTS.khalti.baseUrl),
  };
  const khalti = missing("khalti", khaltiFields)
    ? null
    : {
        secretKey: khaltiFields.KHALTI_SECRET_KEY!,
        baseUrl: khaltiFields.KHALTI_BASE_URL!.replace(/\/+$/, ""),
      };

  const fonepayFields = {
    FONEPAY_MERCHANT_CODE: e.FONEPAY_MERCHANT_CODE,
    FONEPAY_SECRET_KEY: e.FONEPAY_SECRET_KEY,
    FONEPAY_USERNAME: e.FONEPAY_USERNAME,
    FONEPAY_PASSWORD: e.FONEPAY_PASSWORD,
    FONEPAY_BASE_URL: pick(e.FONEPAY_BASE_URL, SANDBOX_DEFAULTS.fonepay.baseUrl),
  };
  const fonepay = missing("fonepay", fonepayFields)
    ? null
    : {
        merchantCode: fonepayFields.FONEPAY_MERCHANT_CODE!,
        secretKey: fonepayFields.FONEPAY_SECRET_KEY!,
        username: fonepayFields.FONEPAY_USERNAME!,
        password: fonepayFields.FONEPAY_PASSWORD!,
        baseUrl: fonepayFields.FONEPAY_BASE_URL!.replace(/\/+$/, ""),
      };

  if (live) {
    for (const [name, url] of [
      ["ESEWA_FORM_URL", esewa?.formUrl],
      ["ESEWA_STATUS_URL", esewa?.statusUrl],
      ["KHALTI_BASE_URL", khalti?.baseUrl],
      ["FONEPAY_BASE_URL", fonepay?.baseUrl],
    ] as const) {
      if (url != null && !url.startsWith("https://")) {
        throw new PaymentConfigError(`PAYMENT_MODE=live requires ${name} to be https`);
      }
    }
  }

  const config: PaymentConfig = { mode, esewa, khalti, fonepay, disabledReasons };

  // Optional allow-list: can only switch configured gateways OFF, never on.
  if (e.PAYMENT_ENABLED_GATEWAYS != null) {
    const allowed = e.PAYMENT_ENABLED_GATEWAYS.split(",")
      .map(name => name.trim())
      .filter(Boolean);
    const unknown = allowed.filter(name => !isGatewayName(name));
    if (unknown.length > 0) {
      throw new PaymentConfigError(
        `PAYMENT_ENABLED_GATEWAYS has unknown gateways: ${unknown.join(", ")}`,
      );
    }
    for (const gateway of GATEWAY_NAMES) {
      if (!allowed.includes(gateway) && config[gateway] != null) {
        config[gateway] = null;
        disabledReasons[gateway] = "not in PAYMENT_ENABLED_GATEWAYS";
      }
    }
  }

  return config;
}

let cached: PaymentConfig | undefined;

export function getPaymentConfig(): PaymentConfig {
  cached ??= resolvePaymentConfig({
    PAYMENT_MODE: env.PAYMENT_MODE,
    PAYMENT_ENABLED_GATEWAYS: env.PAYMENT_ENABLED_GATEWAYS,
    ESEWA_PRODUCT_CODE: env.ESEWA_PRODUCT_CODE,
    ESEWA_SECRET_KEY: env.ESEWA_SECRET_KEY,
    ESEWA_FORM_URL: env.ESEWA_FORM_URL,
    ESEWA_STATUS_URL: env.ESEWA_STATUS_URL,
    KHALTI_SECRET_KEY: env.KHALTI_SECRET_KEY,
    KHALTI_BASE_URL: env.KHALTI_BASE_URL,
    FONEPAY_MERCHANT_CODE: env.FONEPAY_MERCHANT_CODE,
    FONEPAY_SECRET_KEY: env.FONEPAY_SECRET_KEY,
    FONEPAY_USERNAME: env.FONEPAY_USERNAME,
    FONEPAY_PASSWORD: env.FONEPAY_PASSWORD,
    FONEPAY_BASE_URL: env.FONEPAY_BASE_URL,
  });
  return cached;
}

export function getEnabledGateways(): GatewayName[] {
  const config = getPaymentConfig();
  return GATEWAY_NAMES.filter(gateway => config[gateway] != null);
}

export function isGatewayEnabled(gateway: string): gateway is GatewayName {
  return isGatewayName(gateway) && getPaymentConfig()[gateway] != null;
}
