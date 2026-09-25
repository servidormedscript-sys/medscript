-- Cobrança avulsa via Mercado Pago (mensal 30 dias / anual 365 dias)

ALTER TABLE public.subscriptions
  ALTER COLUMN price_cents SET DEFAULT 2990;

UPDATE public.subscriptions
SET price_cents = 2990
WHERE price_cents = 14900;

CREATE TABLE IF NOT EXISTS public.billing_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan_code TEXT NOT NULL CHECK (plan_code IN ('monthly', 'annual')),
  amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
  days INTEGER NOT NULL CHECK (days > 0),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled', 'refunded', 'charged_back')),
  provider TEXT NOT NULL DEFAULT 'mercadopago',
  preference_id TEXT,
  provider_payment_id TEXT UNIQUE,
  failure_reason TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_billing_payments_user_created
  ON public.billing_payments (user_id, created_at DESC);

DROP TRIGGER IF EXISTS billing_payments_updated_at ON public.billing_payments;
CREATE TRIGGER billing_payments_updated_at
  BEFORE UPDATE ON public.billing_payments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.billing_payments ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.billing_payments IS 'Pagamentos do plano confirmados pelo Mercado Pago';

CREATE OR REPLACE FUNCTION public.confirm_billing_payment(
  p_payment_id UUID,
  p_provider_payment_id TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  pay public.billing_payments;
BEGIN
  SELECT * INTO pay
  FROM public.billing_payments
  WHERE id = p_payment_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN 'not_found';
  END IF;

  IF pay.status = 'approved' THEN
    RETURN 'already_applied';
  END IF;

  PERFORM public.add_subscription_days(pay.user_id, pay.days);

  UPDATE public.subscriptions
  SET
    price_cents = pay.amount_cents,
    updated_at = NOW()
  WHERE user_id = pay.user_id;

  UPDATE public.billing_payments
  SET
    status = 'approved',
    provider_payment_id = p_provider_payment_id,
    paid_at = NOW(),
    failure_reason = NULL,
    updated_at = NOW()
  WHERE id = p_payment_id;

  RETURN 'applied';
END;
$$;

REVOKE ALL ON FUNCTION public.confirm_billing_payment(UUID, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.confirm_billing_payment(UUID, TEXT) FROM anon;
REVOKE ALL ON FUNCTION public.confirm_billing_payment(UUID, TEXT) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.confirm_billing_payment(UUID, TEXT) TO service_role;
