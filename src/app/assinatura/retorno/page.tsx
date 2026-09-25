import BrandLogo from "@/components/BrandLogo";
import {
  syncMercadoPagoPayment,
  syncMercadoPagoPreapproval,
  type PaymentSyncResult,
} from "@/lib/payments/apply-payment";
import { BILLING_PLANS } from "@/lib/subscription/plans";
import type { Metadata } from "next";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Pagamento — MEDScript",
  robots: { index: false, follow: false },
};

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function resultCopy(result: PaymentSyncResult | null) {
  if (!result) {
    return {
      title: "Pagamento não identificado",
      text: "Volte ao plano e confira se a compra aparece na lista. Se o Pix ou o boleto ainda estiver em aberto, a liberação acontece quando o Mercado Pago confirmar.",
    };
  }

  if (result.outcome === "applied" || result.outcome === "already_applied") {
    const planName = result.planCode ? BILLING_PLANS[result.planCode].name.toLowerCase() : "contratado";
    const daysText = result.days ? ` ${result.days} dias foram somados ao saldo da clínica.` : "";
    return {
      title: "Pagamento confirmado",
      text: `O plano ${planName} foi aplicado.${daysText}`,
    };
  }

  if (result.outcome === "pending") {
    return {
      title: "Pagamento em análise",
      text:
        "O Mercado Pago ainda não confirmou este pagamento. Pix e cartão costumam liberar em minutos; " +
        "boleto pode levar até 3 dias úteis. Quando for aprovado, os dias entram no saldo da clínica automaticamente.",
    };
  }

  if (result.outcome === "mismatch") {
    return {
      title: "Pagamento não aplicado",
      text: "O valor recebido não corresponde ao plano. Nada foi creditado. Fale com o suporte se o valor já foi debitado.",
    };
  }

  return {
    title: "Pagamento não concluído",
    text: "Este pagamento não foi aprovado. Você pode tentar de novo na página do plano.",
  };
}

export default async function AssinaturaRetornoPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const paymentId = first(params.payment_id) ?? first(params.collection_id);
  const preapprovalId = first(params.preapproval_id);

  let result: PaymentSyncResult | null = null;
  let failed = false;
  let subscriptionUpdated = false;

  try {
    if (preapprovalId) {
      const pre = await syncMercadoPagoPreapproval(preapprovalId);
      subscriptionUpdated = pre.outcome === "updated";
    }
    if (paymentId) {
      result = await syncMercadoPagoPayment(paymentId);
    }
  } catch (error) {
    console.error("[assinatura/retorno]", error);
    failed = true;
  }

  const copy = failed
    ? {
        title: "Não foi possível confirmar agora",
        text: "Se o pagamento foi aprovado, a confirmação automática ainda pode creditar os dias. Atualize o plano em alguns minutos.",
      }
    : result
      ? resultCopy(result)
      : subscriptionUpdated
        ? {
            title: "Assinatura registrada",
            text: "Sua assinatura foi vinculada. Quando o Mercado Pago confirmar a cobrança, os dias entram no saldo da clínica.",
          }
        : resultCopy(null);

  return (
    <div className="min-h-dvh bg-gradient-to-br from-ocean-50/80 via-navy-50 to-white">
      <header className="border-b border-ocean-100 bg-white/90">
        <div className="mx-auto flex h-[72px] max-w-xl items-center px-6">
          <Link href="/assinatura">
            <BrandLogo size="header" />
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-xl px-6 py-12">
        <div className="rounded-3xl border border-ocean-100 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-navy-900">{copy.title}</h1>
          <p className="mt-3 text-sm leading-relaxed text-navy-800/70">{copy.text}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/dashboard"
              className="inline-flex rounded-full bg-ocean-800 px-5 py-2.5 text-sm font-semibold text-white hover:bg-ocean-700"
            >
              Ir para o painel
            </Link>
            <Link
              href="/assinatura"
              className="inline-flex rounded-full border border-ocean-800 px-5 py-2.5 text-sm font-semibold text-ocean-800 hover:bg-ocean-50"
            >
              Ver plano
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
