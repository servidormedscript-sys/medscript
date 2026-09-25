import { createAdminClient } from "@/lib/supabase/admin";
import { fetchMercadoPagoPayment } from "@/lib/payments/mercadopago-core";
import {
  fetchMercadoPagoPreapproval,
  mapMpSubscriptionStatus,
} from "@/lib/payments/mercadopago-subscriptions";
import {
  BILLING_PLANS,
  resolvePlanCodeFromPreapprovalPlanId,
  resolvePlanCodeFromTransactionAmount,
  type PlanCode,
} from "@/lib/subscription/plans";

const USER_ID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type BillingPaymentRow = {
  id: string;
  user_id: string;
  plan_code: PlanCode;
  amount_cents: number;
  days: number;
  status: string;
  preference_id: string | null;
  provider_payment_id: string | null;
  failure_reason: string | null;
  paid_at: string | null;
  created_at: string;
};

export type PaymentSyncResult = {
  outcome:
    | "applied"
    | "already_applied"
    | "pending"
    | "rejected"
    | "cancelled"
    | "refunded"
    | "charged_back"
    | "not_found"
    | "mismatch"
    | "ignored";
  days?: number;
  planCode?: PlanCode;
};

export type PreapprovalSyncResult = {
  outcome: "updated" | "ignored" | "not_found";
  planCode?: PlanCode;
  status?: string;
};

const OPEN_STATUSES = new Set([
  "pending",
  "rejected",
  "cancelled",
  "refunded",
  "charged_back",
]);

function mapStatus(status: string | undefined): PaymentSyncResult["outcome"] {
  if (status === "approved") return "applied";
  if (status === "rejected") return "rejected";
  if (status === "cancelled") return "cancelled";
  if (status === "refunded") return "refunded";
  if (status === "charged_back") return "charged_back";
  if (status === "pending" || status === "in_process" || status === "in_mediation") {
    return "pending";
  }
  return "ignored";
}

function amountMatches(transactionAmount: number | undefined, amountCents: number) {
  if (transactionAmount == null || Number.isNaN(transactionAmount)) return false;
  return Math.round(transactionAmount * 100) === amountCents;
}

async function resolveUserAndPlanForRecurringPayment(input: {
  externalReference: string | null | undefined;
  preapprovalId: string | null | undefined;
  transactionAmount: number | undefined;
}) {
  const admin = createAdminClient();

  if (input.preapprovalId) {
    const { data: byPreapproval } = await admin
      .from("subscriptions")
      .select("user_id, recurring_plan_code")
      .eq("mp_preapproval_id", input.preapprovalId)
      .maybeSingle();

    if (byPreapproval?.user_id && byPreapproval.recurring_plan_code) {
      const planCode = byPreapproval.recurring_plan_code as PlanCode;
      return { userId: byPreapproval.user_id as string, planCode };
    }

    const preapproval = await fetchMercadoPagoPreapproval(input.preapprovalId);
    const planFromMp =
      resolvePlanCodeFromPreapprovalPlanId(preapproval?.preapproval_plan_id) ??
      resolvePlanCodeFromTransactionAmount(preapproval?.auto_recurring?.transaction_amount);
    const userId =
      preapproval?.external_reference && USER_ID_RE.test(preapproval.external_reference)
        ? preapproval.external_reference
        : null;
    if (userId && planFromMp) {
      return { userId, planCode: planFromMp };
    }
  }

  if (input.externalReference && USER_ID_RE.test(input.externalReference)) {
    const { data: sub } = await admin
      .from("subscriptions")
      .select("user_id, recurring_plan_code")
      .eq("user_id", input.externalReference)
      .maybeSingle();

    if (sub?.recurring_plan_code) {
      const planCode = sub.recurring_plan_code as PlanCode;
      if (amountMatches(input.transactionAmount, BILLING_PLANS[planCode].amountCents)) {
        return { userId: sub.user_id as string, planCode };
      }
    }

    const monthly = BILLING_PLANS.monthly;
    const annual = BILLING_PLANS.annual;
    if (amountMatches(input.transactionAmount, monthly.amountCents)) {
      return { userId: input.externalReference, planCode: "monthly" as PlanCode };
    }
    if (amountMatches(input.transactionAmount, annual.amountCents)) {
      return { userId: input.externalReference, planCode: "annual" as PlanCode };
    }
  }

  return null;
}

async function applyRecurringApprovedPayment(input: {
  userId: string;
  planCode: PlanCode;
  providerPaymentId: string;
  preapprovalId: string | null;
}) {
  const plan = BILLING_PLANS[input.planCode];
  const admin = createAdminClient();
  const { data: result, error } = await admin.rpc("apply_recurring_billing_payment", {
    p_user_id: input.userId,
    p_plan_code: input.planCode,
    p_amount_cents: plan.amountCents,
    p_days: plan.days,
    p_provider_payment_id: input.providerPaymentId,
    p_mp_preapproval_id: input.preapprovalId,
  });
  if (error) throw error;
  const outcome = result === "already_applied" ? "already_applied" : "applied";
  return { outcome, days: plan.days, planCode: input.planCode } satisfies PaymentSyncResult;
}

export async function syncMercadoPagoPreapproval(
  preapprovalId: string
): Promise<PreapprovalSyncResult> {
  const preapproval = await fetchMercadoPagoPreapproval(preapprovalId);
  if (!preapproval?.id) return { outcome: "not_found" };

  const userId =
    preapproval.external_reference && USER_ID_RE.test(preapproval.external_reference)
      ? preapproval.external_reference
      : null;
  if (!userId) return { outcome: "ignored" };

  const mappedStatus = mapMpSubscriptionStatus(preapproval.status);
  const planCode =
    resolvePlanCodeFromPreapprovalPlanId(preapproval.preapproval_plan_id) ??
    resolvePlanCodeFromTransactionAmount(preapproval.auto_recurring?.transaction_amount);

  const admin = createAdminClient();
  await admin
    .from("subscriptions")
    .update({
      mp_preapproval_id: preapproval.id,
      mp_subscription_status: mappedStatus,
      ...(planCode ? { recurring_plan_code: planCode } : {}),
      ...(mappedStatus === "authorized" ? { status: "active" as const } : {}),
    })
    .eq("user_id", userId);

  return {
    outcome: "updated",
    planCode: planCode ?? undefined,
    status: preapproval.status,
  };
}

export async function syncMercadoPagoPayment(mpPaymentId: string): Promise<PaymentSyncResult> {
  const payment = await fetchMercadoPagoPayment(mpPaymentId);
  if (!payment) return { outcome: "ignored" };

  const mpStatus = payment.status;
  const providerPaymentId = String(payment.id);

  if (mpStatus === "approved") {
    const recurring = await resolveUserAndPlanForRecurringPayment({
      externalReference: payment.external_reference,
      preapprovalId: payment.preapproval_id,
      transactionAmount: payment.transaction_amount,
    });

    if (recurring) {
      return applyRecurringApprovedPayment({
        userId: recurring.userId,
        planCode: recurring.planCode,
        providerPaymentId,
        preapprovalId: payment.preapproval_id ?? null,
      });
    }
  }

  if (!payment.external_reference) return { outcome: "ignored" };

  const admin = createAdminClient();
  const { data } = await admin
    .from("billing_payments")
    .select(
      "id, user_id, plan_code, amount_cents, days, status, preference_id, provider_payment_id, failure_reason, paid_at, created_at"
    )
    .eq("id", payment.external_reference)
    .maybeSingle();

  const row = data as BillingPaymentRow | null;
  if (!row) return { outcome: "not_found" };

  if (!amountMatches(payment.transaction_amount, row.amount_cents) || payment.currency_id !== "BRL") {
    if (row.status !== "approved") {
      await admin
        .from("billing_payments")
        .update({
          status: "rejected",
          provider_payment_id: providerPaymentId,
          failure_reason: "Valor ou moeda divergente do pedido.",
        })
        .eq("id", row.id)
        .neq("status", "approved");
    }
    return { outcome: "mismatch" };
  }

  if (row.status === "approved") {
    if (mpStatus === "refunded" || mpStatus === "charged_back") {
      await admin
        .from("billing_payments")
        .update({
          status: mpStatus,
          failure_reason: payment.status_detail ?? null,
        })
        .eq("id", row.id);
      return { outcome: mpStatus, days: row.days, planCode: row.plan_code };
    }
    return { outcome: "already_applied", days: row.days, planCode: row.plan_code };
  }

  if (mpStatus === "approved") {
    const { data: result, error } = await admin.rpc("confirm_billing_payment", {
      p_payment_id: row.id,
      p_provider_payment_id: providerPaymentId,
    });
    if (error) throw error;
    const outcome = result === "already_applied" ? "already_applied" : "applied";
    return { outcome, days: row.days, planCode: row.plan_code };
  }

  const outcome = mapStatus(mpStatus);
  const nextStatus = OPEN_STATUSES.has(outcome) ? outcome : "pending";
  await admin
    .from("billing_payments")
    .update({
      status: nextStatus,
      provider_payment_id: providerPaymentId,
      failure_reason: payment.status_detail ?? null,
    })
    .eq("id", row.id)
    .neq("status", "approved");

  return { outcome: nextStatus === "pending" && outcome === "ignored" ? "pending" : outcome };
}
