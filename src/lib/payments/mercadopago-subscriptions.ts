import { getAppBaseUrl } from "@/lib/seo/site";
import {
  BILLING_PLANS,
  getMercadoPagoPreapprovalPlanId,
  getMercadoPagoSubscriptionRecurring,
  type PlanCode,
} from "@/lib/subscription/plans";
import { getMercadoPagoAccessToken, type MercadoPagoApiError } from "@/lib/payments/mercadopago-core";

const API_BASE = "https://api.mercadopago.com";

export type MercadoPagoPreapproval = {
  id?: string;
  status?: string;
  external_reference?: string | null;
  preapproval_plan_id?: string | null;
  payer_email?: string | null;
  init_point?: string;
  sandbox_init_point?: string;
  next_payment_date?: string | null;
  auto_recurring?: {
    transaction_amount?: number;
    currency_id?: string;
  };
  message?: string;
  cause?: { description?: string }[];
};

function mpErrorMessage(body: MercadoPagoApiError, status: number) {
  const cause = body.cause?.map((item) => item.description).filter(Boolean).join(" ");
  return cause || body.message || body.error || `Mercado Pago recusou a operação (${status}).`;
}

function subscriptionCheckoutUrl(token: string, body: MercadoPagoPreapproval) {
  if (token.startsWith("TEST-") && body.sandbox_init_point) {
    return body.sandbox_init_point;
  }
  if (body.init_point) return body.init_point;
  if (body.sandbox_init_point) return body.sandbox_init_point;
  if (body.id) {
    return `https://www.mercadopago.com.br/subscriptions/checkout?preapproval_id=${encodeURIComponent(body.id)}`;
  }
  return null;
}

export async function createSubscriptionCheckout(input: {
  userId: string;
  planCode: PlanCode;
  payerEmail: string;
}) {
  const token = getMercadoPagoAccessToken();
  const preapprovalPlanId = getMercadoPagoPreapprovalPlanId(input.planCode);
  const plan = BILLING_PLANS[input.planCode];
  const baseUrl = getAppBaseUrl();

  const payload: Record<string, unknown> = {
    reason: plan.checkoutTitle,
    external_reference: input.userId,
    payer_email: input.payerEmail,
    back_url: `${baseUrl}/assinatura/retorno`,
    status: "pending",
  };

  if (preapprovalPlanId) {
    payload.preapproval_plan_id = preapprovalPlanId;
  } else {
    payload.auto_recurring = getMercadoPagoSubscriptionRecurring(input.planCode);
  }

  const response = await fetch(`${API_BASE}/preapproval`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const body = (await response.json()) as MercadoPagoPreapproval;
  if (!response.ok) {
    throw new Error(mpErrorMessage(body, response.status));
  }

  const checkoutUrl = subscriptionCheckoutUrl(token, body);
  if (!checkoutUrl) {
    throw new Error("Mercado Pago não devolveu o link da assinatura.");
  }

  return {
    preapprovalId: body.id ?? null,
    checkoutUrl,
  };
}

export async function fetchMercadoPagoPreapproval(preapprovalId: string) {
  const token = getMercadoPagoAccessToken();
  const response = await fetch(`${API_BASE}/preapproval/${encodeURIComponent(preapprovalId)}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (response.status === 404) return null;
  const body = (await response.json()) as MercadoPagoPreapproval;
  if (!response.ok) {
    throw new Error(body.message || "Não foi possível consultar a assinatura no Mercado Pago.");
  }
  return body;
}

export async function cancelMercadoPagoPreapproval(preapprovalId: string) {
  const token = getMercadoPagoAccessToken();
  const response = await fetch(`${API_BASE}/preapproval/${encodeURIComponent(preapprovalId)}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ status: "cancelled" }),
  });

  const body = (await response.json()) as MercadoPagoPreapproval;
  if (!response.ok) {
    throw new Error(mpErrorMessage(body, response.status));
  }
  return body;
}

export function mapMpSubscriptionStatus(
  status: string | undefined
): "pending" | "authorized" | "paused" | "cancelled" | null {
  if (!status) return null;
  const normalized = status.toLowerCase();
  if (normalized === "authorized" || normalized === "active") return "authorized";
  if (normalized === "paused") return "paused";
  if (normalized === "cancelled" || normalized === "canceled") return "cancelled";
  if (normalized === "pending") return "pending";
  return null;
}
