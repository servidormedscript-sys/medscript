/** Reexporta helpers usados pelas rotas de pagamento e webhook. */
export {
  MercadoPagoConfigError,
  fetchMercadoPagoPayment,
  fetchMerchantOrderPaymentIds,
  verifyMercadoPagoSignature,
  type MercadoPagoPayment,
} from "@/lib/payments/mercadopago-core";

export {
  cancelMercadoPagoPreapproval,
  createSubscriptionCheckout,
  fetchMercadoPagoPreapproval,
  mapMpSubscriptionStatus,
} from "@/lib/payments/mercadopago-subscriptions";

export { createOneTimeCheckoutPreference } from "@/lib/payments/mercadopago-checkout-pro";
