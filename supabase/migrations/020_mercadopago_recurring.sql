-- Assinatura recorrente Mercado Pago (preapproval)

ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS mp_preapproval_id TEXT,
  ADD COLUMN IF NOT EXISTS recurring_plan_code TEXT
    CHECK (recurring_plan_code IS NULL OR recurring_plan_code IN ('monthly', 'annual')),
  ADD COLUMN IF NOT EXISTS mp_subscription_status TEXT
    CHECK (
      mp_subscription_status IS NULL
      OR mp_subscription_status IN ('pending', 'authorized', 'paused', 'cancelled')
    );

CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_mp_preapproval_id
  ON public.subscriptions (mp_preapproval_id)
  WHERE mp_preapproval_id IS NOT NULL;

ALTER TABLE public.billing_payments
  ADD COLUMN IF NOT EXISTS mp_preapproval_id TEXT,
  ADD COLUMN IF NOT EXISTS billing_kind TEXT NOT NULL DEFAULT 'one_time'
    CHECK (billing_kind IN ('one_time', 'recurring'));

CREATE OR REPLACE FUNCTION public.apply_recurring_billing_payment(
  p_user_id UUID,
  p_plan_code TEXT,
  p_amount_cents INTEGER,
  p_days INTEGER,
  p_provider_payment_id TEXT,
  p_mp_preapproval_id TEXT DEFAULT NULL
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  existing UUID;
BEGIN
  IF p_provider_payment_id IS NULL OR btrim(p_provider_payment_id) = '' THEN
    RAISE EXCEPTION 'Pagamento inválido';
  END IF;

  SELECT id INTO existing
  FROM public.billing_payments
  WHERE provider_payment_id = p_provider_payment_id
  LIMIT 1;

  IF existing IS NOT NULL THEN
    RETURN 'already_applied';
  END IF;

  INSERT INTO public.billing_payments (
    user_id,
    plan_code,
    amount_cents,
    days,
    status,
    provider_payment_id,
    paid_at,
    billing_kind,
    mp_preapproval_id
  )
  VALUES (
    p_user_id,
    p_plan_code,
    p_amount_cents,
    p_days,
    'approved',
    p_provider_payment_id,
    NOW(),
    'recurring',
    p_mp_preapproval_id
  );

  PERFORM public.add_subscription_days(p_user_id, p_days);

  UPDATE public.subscriptions
  SET
    price_cents = p_amount_cents,
    recurring_plan_code = p_plan_code,
    updated_at = NOW()
  WHERE user_id = p_user_id;

  RETURN 'applied';
END;
$$;

REVOKE ALL ON FUNCTION public.apply_recurring_billing_payment(UUID, TEXT, INTEGER, INTEGER, TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.apply_recurring_billing_payment(UUID, TEXT, INTEGER, INTEGER, TEXT, TEXT) FROM anon;
REVOKE ALL ON FUNCTION public.apply_recurring_billing_payment(UUID, TEXT, INTEGER, INTEGER, TEXT, TEXT) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.apply_recurring_billing_payment(UUID, TEXT, INTEGER, INTEGER, TEXT, TEXT) TO service_role;
