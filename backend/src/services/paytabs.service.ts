import crypto from "node:crypto";
import { env } from "../config/env";
import { AppError } from "../utils/app-error";

// PayTabs regional endpoints
const PAYTABS_ENDPOINTS: Record<string, string> = {
  ARE: "https://secure.paytabs.com",
  SAU: "https://secure.paytabs.sa",
  EGY: "https://secure-egypt.paytabs.com",
  OMN: "https://secure-oman.paytabs.com",
  JOR: "https://secure-jordan.paytabs.com",
  IRQ: "https://secure-iraq.paytabs.com",
  PAK: "https://secure-pakistan.paytabs.com",
  LBN: "https://secure-lebanon.paytabs.com",
};

// PayTabs IP whitelist for webhook validation
export const PAYTABS_IPS = [
  "185.166.136.0/24",
  "178.33.10.248",
  "54.194.248.154",
  "176.31.175.56",
  "62.210.142.230",
  "176.31.199.232",
  "54.246.175.116",
];

function getBaseUrl(): string {
  const region = env.PAYTABS_REGION ?? "ARE";
  const url = PAYTABS_ENDPOINTS[region];
  if (!url) throw new AppError(500, `Unknown PayTabs region: ${region}`, "CONFIG_ERROR");
  return url;
}

export interface InitiatePaymentOptions {
  cartId: string;
  cartDescription: string;
  amount: number;
  currency: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
}

export interface InitiatePaymentResult {
  paymentUrl: string;
  transactionRef: string;
}

export async function initiatePayment(opts: InitiatePaymentOptions): Promise<InitiatePaymentResult> {
  if (!env.PAYTABS_PROFILE_ID || !env.PAYTABS_SERVER_KEY) {
    throw new AppError(503, "Payment service is not configured", "PAYMENT_NOT_CONFIGURED");
  }
  const baseUrl = getBaseUrl();
  const body = {
    profile_id: env.PAYTABS_PROFILE_ID,
    tran_type: "sale",
    tran_class: "ecom",
    cart_id: opts.cartId,
    cart_description: opts.cartDescription,
    cart_currency: opts.currency,
    cart_amount: opts.amount,
    callback: env.PAYTABS_WEBHOOK_URL,
    return: env.PAYTABS_RETURN_URL,
    customer_details: {
      name: opts.customerName,
      email: opts.customerEmail,
      phone: opts.customerPhone ?? "",
      street1: "N/A",
      city: "N/A",
      country: "EG",
    },
  };

  const response = await fetch(`${baseUrl}/payment/request`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: env.PAYTABS_SERVER_KEY,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new AppError(502, `PayTabs request failed: ${text}`, "PAYTABS_ERROR");
  }

  const data = (await response.json()) as {
    redirect_url?: string;
    tran_ref?: string;
    response_status?: string;
    response_message?: string;
  };

  if (!data.redirect_url || !data.tran_ref) {
    throw new AppError(502, `PayTabs error: ${data.response_message ?? "Unknown error"}`, "PAYTABS_ERROR");
  }

  return { paymentUrl: data.redirect_url, transactionRef: data.tran_ref };
}

/** Verifies PayTabs webhook HMAC signature */
export function verifyWebhookSignature(rawBody: Buffer, signatureHeader: string): boolean {
  if (!env.PAYTABS_SERVER_KEY) return false;
  const expected = crypto
    .createHmac("sha256", env.PAYTABS_SERVER_KEY)
    .update(rawBody)
    .digest("hex");
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signatureHeader));
}
