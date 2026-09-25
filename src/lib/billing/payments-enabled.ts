/** Cobrança desligada por padrão até BILLING_PAYMENTS_ENABLED=true na Vercel/.env */
export function isPaymentsEnabled() {
  const raw = process.env.BILLING_PAYMENTS_ENABLED?.trim().toLowerCase();
  return raw === "true" || raw === "1" || raw === "yes";
}
