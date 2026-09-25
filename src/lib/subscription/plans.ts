export const PLAN_CODES = ["monthly", "annual"] as const;

export type PlanCode = (typeof PLAN_CODES)[number];

export type BillingPlan = {
  code: PlanCode;
  name: string;
  amountCents: number;
  days: number;
  periodLabel: string;
  checkoutTitle: string;
  description: string;
};

export const MONTHLY_PLAN: BillingPlan = {
  code: "monthly",
  name: "Mensal",
  amountCents: 2990,
  days: 30,
  periodLabel: "/ mês",
  checkoutTitle: "MEDScript — Plano mensal",
  description: "30 dias de acesso por clínica.",
};

export const ANNUAL_PLAN: BillingPlan = {
  code: "annual",
  name: "Anual",
  amountCents: 24900,
  days: 365,
  periodLabel: "/ ano",
  checkoutTitle: "MEDScript — Plano anual",
  description: "365 dias de acesso por clínica.",
};

export function getMercadoPagoPreapprovalPlanId(planCode: PlanCode) {
  const key =
    planCode === "monthly"
      ? "MERCADOPAGO_PREAPPROVAL_PLAN_MONTHLY"
      : "MERCADOPAGO_PREAPPROVAL_PLAN_ANNUAL";
  return process.env[key]?.trim() || null;
}

export function resolvePlanCodeFromPreapprovalPlanId(
  preapprovalPlanId: string | null | undefined
): PlanCode | null {
  if (!preapprovalPlanId) return null;
  const monthly = getMercadoPagoPreapprovalPlanId("monthly");
  const annual = getMercadoPagoPreapprovalPlanId("annual");
  if (monthly && preapprovalPlanId === monthly) return "monthly";
  if (annual && preapprovalPlanId === annual) return "annual";
  return null;
}

/** Assinatura MP sem plano pré-cadastrado (valor e periodicidade na API). */
export function getMercadoPagoSubscriptionRecurring(planCode: PlanCode) {
  const plan = BILLING_PLANS[planCode];
  return {
    frequency: planCode === "monthly" ? 1 : 12,
    frequency_type: "months" as const,
    transaction_amount: plan.amountCents / 100,
    currency_id: "BRL",
  };
}

export function resolvePlanCodeFromTransactionAmount(
  transactionAmount: number | undefined | null
): PlanCode | null {
  if (transactionAmount == null || Number.isNaN(transactionAmount)) return null;
  const cents = Math.round(transactionAmount * 100);
  if (cents === MONTHLY_PLAN.amountCents) return "monthly";
  if (cents === ANNUAL_PLAN.amountCents) return "annual";
  return null;
}

export const BILLING_PLANS: Record<PlanCode, BillingPlan> = {
  monthly: MONTHLY_PLAN,
  annual: ANNUAL_PLAN,
};

export function isPlanCode(value: unknown): value is PlanCode {
  return value === "monthly" || value === "annual";
}

export function formatBrlFromCents(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function annualSavingsCents() {
  return MONTHLY_PLAN.amountCents * 12 - ANNUAL_PLAN.amountCents;
}
