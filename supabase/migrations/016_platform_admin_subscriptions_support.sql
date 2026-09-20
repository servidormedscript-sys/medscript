-- Admin da plataforma, controle de acesso, assinatura acumulada e suporte

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS platform_role TEXT
    CHECK (platform_role IS NULL OR platform_role IN ('super_admin')),
  ADD COLUMN IF NOT EXISTS account_status TEXT NOT NULL DEFAULT 'active'
    CHECK (account_status IN ('active', 'blocked', 'deactivated')),
  ADD COLUMN IF NOT EXISTS deactivated_at TIMESTAMPTZ;

ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS access_ends_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS paid_days_total INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS complimentary_access BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS complimentary_note TEXT;

UPDATE public.subscriptions
SET access_ends_at = COALESCE(
  GREATEST(current_period_end, trial_ends_at),
  NOW() + INTERVAL '14 days'
)
WHERE access_ends_at IS NULL;

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

CREATE TABLE IF NOT EXISTS public.support_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  guest_name TEXT,
  guest_email TEXT,
  subject TEXT NOT NULL,
  message TEXT NOT NULL CHECK (char_length(btrim(message)) > 0),
  status TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'in_progress', 'closed')),
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_support_messages_status
  ON public.support_messages (status, created_at DESC);

DROP TRIGGER IF EXISTS support_messages_updated_at ON public.support_messages;
CREATE TRIGGER support_messages_updated_at
  BEFORE UPDATE ON public.support_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuário vê próprias mensagens de suporte" ON public.support_messages;
CREATE POLICY "Usuário vê próprias mensagens de suporte"
  ON public.support_messages FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Usuário cria mensagem autenticada" ON public.support_messages;
CREATE POLICY "Usuário cria mensagem autenticada"
  ON public.support_messages FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    avatar_url,
    role,
    user_type,
    parent_admin_id,
    phone
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url',
    COALESCE(NEW.raw_user_meta_data->>'role', 'admin'),
    NEW.raw_user_meta_data->>'user_type',
    NULLIF(NEW.raw_user_meta_data->>'parent_admin_id', '')::uuid,
    NEW.raw_user_meta_data->>'phone'
  );

  IF COALESCE(NEW.raw_user_meta_data->>'role', 'admin') = 'admin'
     AND COALESCE(NEW.raw_user_meta_data->>'platform_role', '') <> 'super_admin' THEN
    INSERT INTO public.subscriptions (
      user_id,
      status,
      trial_ends_at,
      access_ends_at,
      current_period_end
    )
    VALUES (
      NEW.id,
      'trial',
      NOW() + INTERVAL '14 days',
      NOW() + INTERVAL '14 days',
      NOW() + INTERVAL '14 days'
    );
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON COLUMN public.profiles.platform_role IS 'super_admin = administrador do site MEDScript';
COMMENT ON TABLE public.support_messages IS 'Suporte e sugestões de usuários e visitantes';
