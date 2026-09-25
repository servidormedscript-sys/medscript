import { getAppBaseUrl } from "@/lib/seo/site";
import {
  authHeaders,
  getMercadoPagoAccessToken,
  type MercadoPagoApiError,
} from "@/lib/payments/mercadopago-core";
import { BILLING_PLANS, type BillingPlan, type PlanCode } from "@/lib/subscription/plans";

const API_BASE = "https://api.mercadopago.com";

type PreferenceResponse = {
  id?: string;
  init_point?: string;
  sandbox_init_point?: string;
  message?: string;
  error?: string;
  cause?: { description?: string }[];
};

function preferenceErrorMessage(body: PreferenceResponse, status: number) {
  const cause = body.cause?.map((item) => item.description).filter(Boolean).join(" ");
  return cause || body.message || body.error || `Mercado Pago recusou a cobrança (${status}).`;
}

/** Pagamento único (Pix, boleto ou cartão) via Checkout Pro. */
export async function createOneTimeCheckoutPreference(input: {
  paymentId: string;
  planCode: PlanCode;
  payerEmail: string;
  payerName: string | null;
}) {
  const token = getMercadoPagoAccessToken();
  const plan: BillingPlan = BILLING_PLANS[input.planCode];
  const baseUrl = getAppBaseUrl();
  const returnUrl = `${baseUrl}/assinatura/retorno`;
  const isHttps = baseUrl.startsWith("https://");
  const [firstName, ...rest] = (input.payerName ?? "").trim().split(/\s+/);
  const surname = rest.join(" ");

  const payload: Record<string, unknown> = {
    items: [
      {
        id: plan.code,
        title: `${plan.checkoutTitle} (pagamento único)`,
        description: `${plan.days} dias de acesso. Pix, boleto ou cartão. Não renova automaticamente.`,
        quantity: 1,
        currency_id: "BRL",
        unit_price: plan.amountCents / 100,
      },
    ],
    payer: {
      email: input.payerEmail,
      ...(firstName ? { name: firstName } : {}),
      ...(surname ? { surname } : {}),
    },
    back_urls: {
      success: returnUrl,
      failure: returnUrl,
      pending: returnUrl,
    },
    external_reference: input.paymentId,
    statement_descriptor: "MEDSCRIPT",
    metadata: {
      billing_payment_id: input.paymentId,
      plan_code: plan.code,
      billing_kind: "one_time",
    },
  };

  if (isHttps) {
    payload.auto_return = "approved";
    payload.notification_url = `${baseUrl}/api/payments/mercadopago/webhook`;
  }

  const response = await fetch(`${API_BASE}/checkout/preferences`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });

  const body = (await response.json()) as PreferenceResponse;
  if (!response.ok) {
    throw new Error(preferenceErrorMessage(body, response.status));
  }

  const checkoutUrl = token.startsWith("TEST-")
    ? body.sandbox_init_point
    : body.init_point;

  if (!body.id || !checkoutUrl) {
    throw new Error("Mercado Pago não devolveu o link de pagamento.");
  }

  return { preferenceId: body.id, checkoutUrl };
}
