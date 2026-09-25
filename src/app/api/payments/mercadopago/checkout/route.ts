import { NextResponse } from "next/server";
import { getSessionProfile } from "@/lib/auth/get-session-profile";
import {
  createOneTimeCheckoutPreference,
  createSubscriptionCheckout,
  MercadoPagoConfigError,
} from "@/lib/payments/mercadopago";
import { isPaymentsEnabled } from "@/lib/billing/payments-enabled";
import { loadSubscriptionForProfile } from "@/lib/platform/account-access";
import { createAdminClient } from "@/lib/supabase/admin";
import { canPurchasePlan } from "@/lib/subscription/access";
import { BILLING_PLANS, isPlanCode } from "@/lib/subscription/plans";

export const dynamic = "force-dynamic";

export type CheckoutMode = "subscription" | "one_time";

function isCheckoutMode(value: unknown): value is CheckoutMode {
  return value === "subscription" || value === "one_time";
}

export async function POST(request: Request) {
  const { user, profile } = await getSessionProfile();
  if (!user || !profile) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  if (!isPaymentsEnabled()) {
    return NextResponse.json(
      { error: "Os pagamentos ainda não estão disponíveis na plataforma." },
      { status: 403 }
    );
  }

  if (profile.platform_role === "super_admin") {
    return NextResponse.json(
      { error: "A conta de administrador da plataforma não possui cobrança." },
      { status: 400 }
    );
  }

  if (profile.role !== "admin") {
    return NextResponse.json(
      { error: "Apenas o administrador da clínica pode contratar o plano." },
      { status: 403 }
    );
  }

  if (profile.account_status !== "active") {
    return NextResponse.json(
      { error: "Sua conta não pode contratar o plano neste momento." },
      { status: 403 }
    );
  }

  let body: { plan?: unknown; mode?: unknown } = {};
  try {
    body = (await request.json()) as { plan?: unknown; mode?: unknown };
  } catch {
    body = {};
  }

  if (!isPlanCode(body.plan)) {
    return NextResponse.json({ error: "Escolha o plano mensal ou anual." }, { status: 400 });
  }

  const mode: CheckoutMode = isCheckoutMode(body.mode) ? body.mode : "subscription";
  const plan = BILLING_PLANS[body.plan];
  const admin = createAdminClient();

  const subscription = await loadSubscriptionForProfile(profile);
  if (!canPurchasePlan(subscription)) {
    return NextResponse.json(
      {
        error:
          "Durante os 14 dias de avaliação gratuita não é necessário contratar. Quando o teste estiver acabando, volte aqui para pagar.",
      },
      { status: 400 }
    );
  }

  if (mode === "subscription") {
    const { data: sub } = await admin
      .from("subscriptions")
      .select("mp_subscription_status")
      .eq("user_id", profile.id)
      .maybeSingle();

    if (sub?.mp_subscription_status === "authorized") {
      return NextResponse.json(
        {
          error:
            "Já existe assinatura no cartão. Cancele a renovação automática ou use pagamento único (Pix/boleto).",
        },
        { status: 409 }
      );
    }

    try {
      const checkout = await createSubscriptionCheckout({
        userId: profile.id,
        planCode: body.plan,
        payerEmail: profile.email,
      });

      if (checkout.preapprovalId) {
        await admin
          .from("subscriptions")
          .update({
            mp_preapproval_id: checkout.preapprovalId,
            mp_subscription_status: "pending",
            recurring_plan_code: body.plan,
          })
          .eq("user_id", profile.id);
      }

      return NextResponse.json({ url: checkout.checkoutUrl });
    } catch (error) {
      if (error instanceof MercadoPagoConfigError) {
        return NextResponse.json(
          { error: "Pagamento temporariamente indisponível." },
          { status: 503 }
        );
      }
      console.error("[payments/checkout] subscription", error);
      const message =
        error instanceof Error ? error.message : "Não foi possível iniciar a assinatura.";
      return NextResponse.json({ error: message }, { status: 502 });
    }
  }

  const { data: created, error: insertError } = await admin
    .from("billing_payments")
    .insert({
      user_id: profile.id,
      plan_code: plan.code,
      amount_cents: plan.amountCents,
      days: plan.days,
      status: "pending",
      billing_kind: "one_time",
    })
    .select("id")
    .single();

  if (insertError || !created) {
    console.error("[payments/checkout] one_time insert", insertError);
    return NextResponse.json(
      { error: "Não foi possível iniciar o pagamento." },
      { status: 500 }
    );
  }

  try {
    const preference = await createOneTimeCheckoutPreference({
      paymentId: created.id,
      planCode: body.plan,
      payerEmail: profile.email,
      payerName: profile.full_name,
    });

    await admin
      .from("billing_payments")
      .update({ preference_id: preference.preferenceId })
      .eq("id", created.id);

    return NextResponse.json({ url: preference.checkoutUrl });
  } catch (error) {
    await admin.from("billing_payments").delete().eq("id", created.id);

    if (error instanceof MercadoPagoConfigError) {
      return NextResponse.json(
        { error: "Pagamento temporariamente indisponível." },
        { status: 503 }
      );
    }
    console.error("[payments/checkout] one_time", error);
    const message =
      error instanceof Error ? error.message : "Não foi possível iniciar o pagamento.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
