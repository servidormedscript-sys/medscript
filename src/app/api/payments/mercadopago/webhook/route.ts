import { NextResponse } from "next/server";
import { syncMercadoPagoPayment, syncMercadoPagoPreapproval } from "@/lib/payments/apply-payment";
import {
  fetchMerchantOrderPaymentIds,
  MercadoPagoConfigError,
  verifyMercadoPagoSignature,
} from "@/lib/payments/mercadopago";

export const dynamic = "force-dynamic";

type NotificationBody = {
  type?: string;
  topic?: string;
  action?: string;
  data?: { id?: string | number };
};

function firstParam(url: URL, key: string) {
  return url.searchParams.get(key);
}

export async function POST(request: Request) {
  const url = new URL(request.url);
  let body: NotificationBody = {};
  try {
    const raw = await request.text();
    body = raw ? (JSON.parse(raw) as NotificationBody) : {};
  } catch {
    body = {};
  }

  const queryType = firstParam(url, "type") ?? firstParam(url, "topic");
  const type = body.type ?? body.topic ?? queryType ?? "";
  const dataId =
    firstParam(url, "data.id") ??
    firstParam(url, "id") ??
    (body.data?.id == null ? null : String(body.data.id));

  const signatureOk = verifyMercadoPagoSignature({
    xSignature: request.headers.get("x-signature"),
    xRequestId: request.headers.get("x-request-id"),
    dataId,
  });

  if (!signatureOk) {
    return NextResponse.json({ error: "Assinatura inválida." }, { status: 401 });
  }

  const isPayment = type === "payment" || (body.action ?? "").startsWith("payment.");
  const isOrder = type === "merchant_order";
  const isPreapproval =
    type === "subscription_preapproval" ||
    type === "preapproval" ||
    (body.action ?? "").startsWith("subscription_preapproval");

  if (!dataId || (!isPayment && !isOrder && !isPreapproval)) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  try {
    if (isPreapproval) {
      await syncMercadoPagoPreapproval(dataId);
      return NextResponse.json({ ok: true });
    }

    if (isOrder) {
      const paymentIds = await fetchMerchantOrderPaymentIds(dataId);
      for (const paymentId of paymentIds) {
        await syncMercadoPagoPayment(paymentId);
      }
      return NextResponse.json({ ok: true });
    }

    await syncMercadoPagoPayment(dataId);

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof MercadoPagoConfigError) {
      return NextResponse.json({ error: "Pagamento não configurado." }, { status: 503 });
    }
    console.error("[payments/webhook]", error);
    return NextResponse.json({ error: "Falha ao confirmar pagamento." }, { status: 500 });
  }
}
