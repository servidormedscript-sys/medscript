/**
 * Cria os planos de assinatura no Mercado Pago e imprime as variáveis de ambiente.
 *
 * Uso:
 *   MERCADOPAGO_ACCESS_TOKEN=TEST-... node scripts/create-mp-subscription-plans.mjs
 *   MERCADOPAGO_ACCESS_TOKEN=TEST-... NEXT_PUBLIC_SITE_URL=https://www.medscript.com.br node scripts/create-mp-subscription-plans.mjs
 */

const token = process.env.MERCADOPAGO_ACCESS_TOKEN?.trim();
const backUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "") ||
  "https://www.medscript.com.br";

if (!token) {
  console.error("Defina MERCADOPAGO_ACCESS_TOKEN.");
  process.exit(1);
}

async function createPlan(payload) {
  const response = await fetch("https://api.mercadopago.com/preapproval_plan", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const body = await response.json();
  if (!response.ok) {
    throw new Error(JSON.stringify(body));
  }
  return body;
}

const monthly = await createPlan({
  reason: "MEDScript — Plano mensal",
  auto_recurring: {
    frequency: 1,
    frequency_type: "months",
    transaction_amount: 29.9,
    currency_id: "BRL",
  },
  back_url: `${backUrl}/assinatura/retorno`,
});

const annual = await createPlan({
  reason: "MEDScript — Plano anual",
  auto_recurring: {
    frequency: 12,
    frequency_type: "months",
    transaction_amount: 249,
    currency_id: "BRL",
  },
  back_url: `${backUrl}/assinatura/retorno`,
});

console.log("\nCole no .env.local e na Vercel:\n");
console.log(`MERCADOPAGO_PREAPPROVAL_PLAN_MONTHLY=${monthly.id}`);
console.log(`MERCADOPAGO_PREAPPROVAL_PLAN_ANNUAL=${annual.id}`);
console.log("");
