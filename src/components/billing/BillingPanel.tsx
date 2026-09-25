"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ANNUAL_PLAN,
  BILLING_PLANS,
  MONTHLY_PLAN,
  annualSavingsCents,
  formatBrlFromCents,
  type PlanCode,
} from "@/lib/subscription/plans";

export type BillingHistoryItem = {
  id: string;
  planCode: PlanCode;
  amountCents: number;
  days: number;
  status: string;
  createdAt: string;
};

type BillingPanelProps = {
  clinicName: string | null;
  accessEndsAt: string | null;
  daysRemaining: number | null;
  complimentary: boolean;
  hasAccess: boolean;
  inFreeTrial: boolean;
  canPurchase: boolean;
  trialEndsAt: string | null;
  recurringPlanCode: PlanCode | null;
  mpSubscriptionStatus: string | null;
  payments: BillingHistoryItem[];
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Aguardando confirmação",
  approved: "Aprovado",
  rejected: "Recusado",
  cancelled: "Cancelado",
  refunded: "Estornado",
  charged_back: "Contestado",
};

function formatWhen(value: string | null) {
  if (!value) return null;
  return new Date(value).toLocaleString("pt-BR", {
    dateStyle: "long",
    timeStyle: "short",
  });
}

export default function BillingPanel({
  clinicName,
  accessEndsAt,
  daysRemaining,
  complimentary,
  hasAccess,
  inFreeTrial,
  canPurchase,
  trialEndsAt,
  recurringPlanCode,
  mpSubscriptionStatus,
  payments,
}: BillingPanelProps) {
  const router = useRouter();
  const [loadingKey, setLoadingKey] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const savings = formatBrlFromCents(annualSavingsCents());
  const autoRenewActive = mpSubscriptionStatus === "authorized" && recurringPlanCode;
  const hasPendingPayment = payments.some((p) => p.status === "pending");

  async function startCheckout(plan: PlanCode, mode: "subscription" | "one_time") {
    setError(null);
    const key = `${plan}-${mode}`;
    setLoadingKey(key);
    try {
      const response = await fetch("/api/payments/mercadopago/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, mode }),
      });
      const data = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !data.url) {
        setError(data.error ?? "Não foi possível abrir o Mercado Pago.");
        setLoadingKey(null);
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("Não foi possível abrir o Mercado Pago.");
      setLoadingKey(null);
    }
  }

  async function cancelSubscription() {
    const confirmed = window.confirm(
      "Cancelar a renovação automática no cartão?\n\n" +
        "• Novas cobranças serão interrompidas.\n" +
        "• O acesso continua até o fim dos dias já pagos.\n" +
        "• O MEDScript não armazena dados do cartão; eles ficam no Mercado Pago. " +
        "Você pode removê-los na sua conta do Mercado Pago.\n\n" +
        "Consulte também a política de cancelamento e reembolso em /cancelamento."
    );
    if (!confirmed) return;

    setError(null);
    setCancelling(true);
    try {
      const response = await fetch("/api/payments/mercadopago/subscription/cancel", {
        method: "POST",
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(data.error ?? "Não foi possível cancelar a assinatura.");
        setCancelling(false);
        return;
      }
      router.refresh();
    } catch {
      setError("Não foi possível cancelar a assinatura.");
    } finally {
      setCancelling(false);
    }
  }

  const endsLabel = formatWhen(accessEndsAt);
  const trialEndLabel = formatWhen(trialEndsAt);
  const accessText = complimentary
    ? "Acesso liberado pela plataforma."
    : inFreeTrial
      ? "Você está no período de avaliação gratuita de 14 dias."
      : daysRemaining == null
        ? "Sem data de encerramento definida."
        : daysRemaining <= 0
          ? "O acesso desta clínica está encerrado."
          : daysRemaining === 1
            ? "Resta 1 dia de acesso."
            : `Restam ${daysRemaining} dias de acesso.`;

  const activePlan = recurringPlanCode ? BILLING_PLANS[recurringPlanCode] : null;

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="rounded-3xl border border-ocean-100 bg-white p-6 shadow-sm md:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ocean-800">
          Plano Profissional
        </p>
        <h1 className="mt-2 text-2xl font-bold text-navy-900">
          {clinicName ? clinicName : "Sua clínica"}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-navy-800/70">{accessText}</p>
        {inFreeTrial && trialEndLabel ? (
          <p className="mt-1 text-sm text-navy-800/55">Avaliação válida até {trialEndLabel}.</p>
        ) : null}
        {endsLabel && !complimentary && !inFreeTrial ? (
          <p className="mt-1 text-sm text-navy-800/55">Válido até {endsLabel}.</p>
        ) : null}

        {inFreeTrial ? (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-950">
            Não é necessário contratar agora. Use o MEDScript normalmente durante a avaliação.
            Quando faltarem poucos dias para o fim do teste, você poderá pagar aqui.
          </div>
        ) : null}

        {hasPendingPayment ? (
          <div className="mt-4 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-950">
            Há um pagamento aguardando confirmação. Pix costuma liberar em minutos; boleto pode
            levar até <strong>3 dias úteis</strong>. Quando o Mercado Pago aprovar, o acesso é
            liberado automaticamente — você pode atualizar esta página depois.
          </div>
        ) : null}

        {autoRenewActive && activePlan ? (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-950">
            <p>
              <strong>Renovação automática ativa</strong> — plano {activePlan.name.toLowerCase()} (
              {formatBrlFromCents(activePlan.amountCents)}
              {activePlan.code === "monthly" ? " por mês" : " por ano"}).
            </p>
            <button
              type="button"
              onClick={cancelSubscription}
              disabled={cancelling}
              className="mt-3 rounded-full border border-emerald-300 bg-white px-4 py-2 text-sm font-semibold text-emerald-900 hover:bg-emerald-100/80 disabled:opacity-60"
            >
              {cancelling ? "Cancelando..." : "Cancelar renovação automática"}
            </button>
          </div>
        ) : null}

        {!hasAccess && canPurchase ? (
          <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            Pague com Pix, boleto ou cartão (pagamento único) ou assine no cartão para renovação
            automática.
          </p>
        ) : null}

        {canPurchase ? (
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {[MONTHLY_PLAN, ANNUAL_PLAN].map((plan) => {
              const highlighted = plan.code === "annual";
              const subKey = `${plan.code}-subscription`;
              const onceKey = `${plan.code}-one_time`;
              return (
                <div
                  key={plan.code}
                  className={`rounded-2xl border p-5 ${
                    highlighted
                      ? "border-ocean-300 bg-ocean-50/70"
                      : "border-ocean-100 bg-white"
                  }`}
                >
                  <p className="text-sm font-semibold text-navy-900">{plan.name}</p>
                  <p className="mt-2 text-3xl font-bold text-navy-900">
                    {formatBrlFromCents(plan.amountCents)}
                  </p>
                  <p className="mt-1 text-sm text-navy-800/60">{plan.description}</p>
                  {highlighted ? (
                    <p className="mt-2 text-sm font-medium text-emerald-800">
                      Economize {savings} em relação a 12 meses.
                    </p>
                  ) : null}
                  <div className="mt-5 space-y-2">
                    {!autoRenewActive ? (
                      <button
                        type="button"
                        onClick={() => startCheckout(plan.code, "subscription")}
                        disabled={loadingKey !== null}
                        className="w-full rounded-full bg-ocean-800 py-3 text-sm font-semibold text-white transition-colors hover:bg-ocean-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {loadingKey === subKey
                          ? "Abrindo Mercado Pago..."
                          : "Assinar no cartão (renova sozinha)"}
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => startCheckout(plan.code, "one_time")}
                      disabled={loadingKey !== null}
                      className={`w-full rounded-full py-3 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                        autoRenewActive
                          ? "bg-ocean-800 text-white hover:bg-ocean-700"
                          : "border border-ocean-200 bg-white text-ocean-900 hover:bg-ocean-50"
                      }`}
                    >
                      {loadingKey === onceKey
                        ? "Abrindo Mercado Pago..."
                        : "Pagar uma vez (Pix, boleto ou cartão)"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}

        {error ? (
          <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </p>
        ) : null}

        <p className="mt-5 text-xs leading-relaxed text-navy-800/50">
          Cartão na assinatura renova automaticamente. Pix e boleto são pagamento único: somam dias
          ao saldo quando o Mercado Pago confirma (boleto pode levar até 3 dias úteis). O MEDScript
          não guarda número de cartão — o processamento é feito pelo Mercado Pago.{" "}
          <Link href="/cancelamento" className="font-medium text-ocean-800 underline underline-offset-2">
            Cancelamento e reembolso
          </Link>
          .
        </p>
      </div>

      {payments.length > 0 ? (
        <div className="mt-6 rounded-3xl border border-ocean-100 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-navy-900">Cobranças</h2>
          <ul className="mt-4 divide-y divide-ocean-100">
            {payments.map((payment) => (
              <li key={payment.id} className="flex items-center justify-between gap-4 py-3 text-sm">
                <div>
                  <p className="font-medium text-navy-900">
                    {BILLING_PLANS[payment.planCode].name} · {payment.days} dias
                  </p>
                  <p className="text-navy-800/50">{formatWhen(payment.createdAt)}</p>
                  {payment.status === "pending" ? (
                    <p className="mt-0.5 text-xs text-sky-800">
                      Aguardando Mercado Pago (boleto: até 3 dias úteis)
                    </p>
                  ) : null}
                </div>
                <div className="text-right">
                  <p className="font-medium text-navy-900">
                    {formatBrlFromCents(payment.amountCents)}
                  </p>
                  <p className="text-navy-800/50">
                    {STATUS_LABEL[payment.status] ?? payment.status}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
