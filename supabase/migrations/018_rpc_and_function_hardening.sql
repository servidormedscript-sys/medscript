-- Endurecimento de RPC expostas via PostgREST e funções auxiliares

-- ============================================================
-- 1. add_subscription_days: apenas service_role (API plataforma)
-- ============================================================
CREATE OR REPLACE FUNCTION public.add_subscription_days(
  p_user_id UUID,
  p_days INTEGER
)
RETURNS public.subscriptions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sub public.subscriptions;
  base TIMESTAMPTZ;
BEGIN
  IF p_days IS NULL OR p_days <= 0 THEN
    RAISE EXCEPTION 'Dias inválidos';
  END IF;

  SELECT * INTO sub FROM public.subscriptions WHERE user_id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Assinatura não encontrada';
  END IF;

  base := GREATEST(NOW(), COALESCE(sub.access_ends_at, NOW()));
  UPDATE public.subscriptions
  SET
    access_ends_at = base + (p_days || ' days')::INTERVAL,
    paid_days_total = paid_days_total + p_days,
    status = 'active',
    current_period_end = base + (p_days || ' days')::INTERVAL,
    updated_at = NOW()
  WHERE user_id = p_user_id
  RETURNING * INTO sub;

  RETURN sub;
END;
$$;

REVOKE ALL ON FUNCTION public.add_subscription_days(UUID, INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.add_subscription_days(UUID, INTEGER) FROM anon;
REVOKE ALL ON FUNCTION public.add_subscription_days(UUID, INTEGER) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.add_subscription_days(UUID, INTEGER) TO service_role;

-- ============================================================
-- 2. archive_expired_alta_patients: só usuários autenticados (API)
-- ============================================================
REVOKE ALL ON FUNCTION public.archive_expired_alta_patients() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.archive_expired_alta_patients() FROM anon;
GRANT EXECUTE ON FUNCTION public.archive_expired_alta_patients() TO authenticated;
GRANT EXECUTE ON FUNCTION public.archive_expired_alta_patients() TO service_role;

-- ============================================================
-- 3. handle_new_user: trigger only (sem RPC anônima)
-- ============================================================
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM anon;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM authenticated;

-- ============================================================
-- 4. user_belongs_to_admin: usada em RLS; bloquear anon na API
-- ============================================================
REVOKE ALL ON FUNCTION public.user_belongs_to_admin(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.user_belongs_to_admin(UUID) FROM anon;
GRANT EXECUTE ON FUNCTION public.user_belongs_to_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_belongs_to_admin(UUID) TO service_role;

-- ============================================================
-- 5. update_updated_at: search_path fixo (advisor 0011)
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.update_updated_at() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.update_updated_at() FROM anon;
REVOKE ALL ON FUNCTION public.update_updated_at() FROM authenticated;
