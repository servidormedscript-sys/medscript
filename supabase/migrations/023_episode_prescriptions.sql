-- ============================================================
-- MEDScript — Prescrição de internação (Fase 3)
-- ============================================================

DO $$ BEGIN
  CREATE TYPE public.med_reconciliation_status AS ENUM (
    'pendente',
    'mantida',
    'suspensa'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.episode_prescriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  episode_id UUID NOT NULL REFERENCES public.patient_episodes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  dose TEXT NOT NULL DEFAULT '',
  route TEXT NOT NULL DEFAULT '',
  frequency TEXT NOT NULL DEFAULT '',
  indication TEXT NOT NULL DEFAULT '',
  duration_days INTEGER,
  use_continuous BOOLEAN NOT NULL DEFAULT false,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  suspended_at TIMESTAMPTZ,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT episode_prescriptions_name_check CHECK (btrim(name) <> '')
);

CREATE TABLE IF NOT EXISTS public.episode_med_reconciliation (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  episode_id UUID NOT NULL REFERENCES public.patient_episodes(id) ON DELETE CASCADE,
  medication_text TEXT NOT NULL,
  status public.med_reconciliation_status NOT NULL DEFAULT 'pendente',
  decided_at TIMESTAMPTZ,
  decided_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  linked_prescription_id UUID REFERENCES public.episode_prescriptions(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT episode_med_reconciliation_text_check CHECK (btrim(medication_text) <> '')
);

CREATE TABLE IF NOT EXISTS public.episode_general_orders (
  episode_id UUID PRIMARY KEY REFERENCES public.patient_episodes(id) ON DELETE CASCADE,
  order_flags JSONB NOT NULL DEFAULT '{}',
  diet TEXT NOT NULL DEFAULT 'dieta_oral_geral',
  vitals_frequency TEXT NOT NULL DEFAULT '6_6h',
  padua_score JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_episode_prescriptions_episode
  ON public.episode_prescriptions(episode_id, suspended_at);

CREATE INDEX IF NOT EXISTS idx_episode_med_reconciliation_episode
  ON public.episode_med_reconciliation(episode_id, status);

ALTER TABLE public.episode_prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.episode_med_reconciliation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.episode_general_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Org vê prescrições" ON public.episode_prescriptions;
CREATE POLICY "Org vê prescrições"
  ON public.episode_prescriptions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.patient_episodes pe
      JOIN public.patients p ON p.id = pe.patient_id
      WHERE pe.id = episode_id AND public.user_belongs_to_admin(p.admin_id)
    )
  );

DROP POLICY IF EXISTS "Org cria prescrições" ON public.episode_prescriptions;
CREATE POLICY "Org cria prescrições"
  ON public.episode_prescriptions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.patient_episodes pe
      JOIN public.patients p ON p.id = pe.patient_id
      WHERE pe.id = episode_id
        AND pe.archived_at IS NULL
        AND public.user_belongs_to_admin(p.admin_id)
    )
  );

DROP POLICY IF EXISTS "Org atualiza prescrições" ON public.episode_prescriptions;
CREATE POLICY "Org atualiza prescrições"
  ON public.episode_prescriptions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.patient_episodes pe
      JOIN public.patients p ON p.id = pe.patient_id
      WHERE pe.id = episode_id
        AND pe.archived_at IS NULL
        AND public.user_belongs_to_admin(p.admin_id)
    )
  );

DROP POLICY IF EXISTS "Org vê reconciliação" ON public.episode_med_reconciliation;
CREATE POLICY "Org vê reconciliação"
  ON public.episode_med_reconciliation FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.patient_episodes pe
      JOIN public.patients p ON p.id = pe.patient_id
      WHERE pe.id = episode_id AND public.user_belongs_to_admin(p.admin_id)
    )
  );

DROP POLICY IF EXISTS "Org cria reconciliação" ON public.episode_med_reconciliation;
CREATE POLICY "Org cria reconciliação"
  ON public.episode_med_reconciliation FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.patient_episodes pe
      JOIN public.patients p ON p.id = pe.patient_id
      WHERE pe.id = episode_id
        AND pe.archived_at IS NULL
        AND public.user_belongs_to_admin(p.admin_id)
    )
  );

DROP POLICY IF EXISTS "Org atualiza reconciliação" ON public.episode_med_reconciliation;
CREATE POLICY "Org atualiza reconciliação"
  ON public.episode_med_reconciliation FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.patient_episodes pe
      JOIN public.patients p ON p.id = pe.patient_id
      WHERE pe.id = episode_id
        AND pe.archived_at IS NULL
        AND public.user_belongs_to_admin(p.admin_id)
    )
  );

DROP POLICY IF EXISTS "Org vê ordens gerais" ON public.episode_general_orders;
CREATE POLICY "Org vê ordens gerais"
  ON public.episode_general_orders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.patient_episodes pe
      JOIN public.patients p ON p.id = pe.patient_id
      WHERE pe.id = episode_id AND public.user_belongs_to_admin(p.admin_id)
    )
  );

DROP POLICY IF EXISTS "Org grava ordens gerais" ON public.episode_general_orders;
CREATE POLICY "Org grava ordens gerais"
  ON public.episode_general_orders FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.patient_episodes pe
      JOIN public.patients p ON p.id = pe.patient_id
      WHERE pe.id = episode_id
        AND pe.archived_at IS NULL
        AND public.user_belongs_to_admin(p.admin_id)
    )
  );

DROP POLICY IF EXISTS "Org atualiza ordens gerais" ON public.episode_general_orders;
CREATE POLICY "Org atualiza ordens gerais"
  ON public.episode_general_orders FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.patient_episodes pe
      JOIN public.patients p ON p.id = pe.patient_id
      WHERE pe.id = episode_id
        AND pe.archived_at IS NULL
        AND public.user_belongs_to_admin(p.admin_id)
    )
  );
