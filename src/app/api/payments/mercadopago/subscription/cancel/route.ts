import { NextResponse } from "next/server";
import { getSessionProfile } from "@/lib/auth/get-session-profile";
import {
  cancelMercadoPagoPreapproval,
  MercadoPagoConfigError,
} from "@/lib/payments/mercadopago";
import { isPaymentsEnabled } from "@/lib/billing/payments-enabled";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function POST() {
  const { user, profile } = await getSessionProfile();
  if (!user || !profile) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  if (!isPaymentsEnabled()) {
    return NextResponse.json({ error: "Pagamentos desativados." }, { status: 403 });
  }

  if (profile.role !== "admin" || profile.platform_role === "super_admin") {
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  }

  const admin = createAdminClient();
  const { data: sub } = await admin
    .from("subscriptions")
    .select("mp_preapproval_id, mp_subscription_status")
    .eq("user_id", profile.id)
    .maybeSingle();

  const preapprovalId = sub?.mp_preapproval_id;
  if (!preapprovalId || sub?.mp_subscription_status !== "authorized") {
    return NextResponse.json(
      { error: "Não há assinatura ativa para cancelar." },
      { status: 400 }
    );
  }

  try {
    await cancelMercadoPagoPreapproval(preapprovalId);
    await admin
      .from("subscriptions")
      .update({ mp_subscription_status: "cancelled" })
      .eq("user_id", profile.id);

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof MercadoPagoConfigError) {
      return NextResponse.json({ error: "Pagamento indisponível." }, { status: 503 });
    }
    console.error("[payments/subscription/cancel]", error);
    const message =
      error instanceof Error ? error.message : "Não foi possível cancelar a assinatura.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
