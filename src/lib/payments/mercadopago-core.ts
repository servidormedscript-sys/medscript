import { createHmac, timingSafeEqual } from "crypto";

const API_BASE = "https://api.mercadopago.com";

export class MercadoPagoConfigError extends Error {
  constructor() {
    super("MERCADOPAGO_ACCESS_TOKEN não configurado.");
    this.name = "MercadoPagoConfigError";
  }
}

export type MercadoPagoApiError = {
  message?: string;
  error?: string;
  cause?: { description?: string }[];
};

export type MercadoPagoPayment = {
  id: number | string;
  status?: string;
  status_detail?: string | null;
  transaction_amount?: number;
  currency_id?: string;
  external_reference?: string | null;
  preapproval_id?: string | null;
};

type MerchantOrder = {
  payments?: { id?: number | string }[];
};

export function getMercadoPagoAccessToken() {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN?.trim();
  if (!token) throw new MercadoPagoConfigError();
  return token;
}

export function authHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

export async function fetchMercadoPagoPayment(paymentId: string) {
  const token = getMercadoPagoAccessToken();
  const response = await fetch(`${API_BASE}/v1/payments/${encodeURIComponent(paymentId)}`, {
    headers: authHeaders(token),
    cache: "no-store",
  });

  if (response.status === 404) return null;
  const body = (await response.json()) as MercadoPagoPayment & { message?: string };
  if (!response.ok) {
    throw new Error(body.message || "Não foi possível consultar o pagamento no Mercado Pago.");
  }
  return body;
}

export async function fetchMerchantOrderPaymentIds(orderId: string) {
  const token = getMercadoPagoAccessToken();
  const response = await fetch(
    `${API_BASE}/merchant_orders/${encodeURIComponent(orderId)}`,
    { headers: authHeaders(token), cache: "no-store" }
  );
  if (!response.ok) return [];
  const body = (await response.json()) as MerchantOrder;
  return (body.payments ?? [])
    .map((payment) => (payment.id == null ? "" : String(payment.id)))
    .filter(Boolean);
}

function signaturesMatch(expected: string, received: string) {
  const left = Buffer.from(expected);
  const right = Buffer.from(received);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export function verifyMercadoPagoSignature(input: {
  xSignature: string | null;
  xRequestId: string | null;
  dataId: string | null;
}) {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET?.trim();
  if (!secret) return true;
  if (!input.xSignature || !input.xRequestId || !input.dataId) return false;

  let ts = "";
  let hash = "";
  for (const part of input.xSignature.split(",")) {
    const [key, value] = part.split("=");
    if (!key || !value) continue;
    if (key.trim() === "ts") ts = value.trim();
    if (key.trim() === "v1") hash = value.trim();
  }
  if (!ts || !hash) return false;

  const dataId = /[a-z]/i.test(input.dataId) ? input.dataId.toLowerCase() : input.dataId;
  const manifest = `id:${dataId};request-id:${input.xRequestId};ts:${ts};`;
  const expected = createHmac("sha256", secret).update(manifest).digest("hex");
  return signaturesMatch(expected, hash);
}
