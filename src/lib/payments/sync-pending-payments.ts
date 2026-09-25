import { createAdminClient } from "@/lib/supabase/admin";
import { syncMercadoPagoPayment } from "@/lib/payments/apply-payment";

/** Reconsulta pagamentos Pix/boleto pendentes no Mercado Pago (ex.: compensação do boleto). */
export async function syncPendingPaymentsForUser(userId: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("billing_payments")
    .select("provider_payment_id")
    .eq("user_id", userId)
    .eq("status", "pending")
    .not("provider_payment_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(12);

  for (const row of data ?? []) {
    const id = row.provider_payment_id as string | null;
    if (!id) continue;
    try {
      await syncMercadoPagoPayment(id);
    } catch (error) {
      console.error("[sync-pending-payments]", id, error);
    }
  }
}
