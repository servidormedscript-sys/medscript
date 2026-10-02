-- ============================================================
-- MEDScript — Exames laboratoriais e pendentes (Fase 4)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.episode_lab_values (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  episode_id UUID NOT NULL REFERENCES public.patient_episodes(id) ON DELETE CASCADE,
  analyte_key TEXT NOT NULL,
  value NUMERIC NOT NULL,
  collected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT episode_lab_values_analyte_check CHECK (btrim(analyte_key) <> '')
);

CREATE TABLE IF NOT EXISTS public.episode_lab_pending (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  episode_id UUID NOT NULL REFERENCES public.patient_episodes(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  analyte_key TEXT,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expected_note TEXT,
  urgent BOOLEAN NOT NULL DEFAULT false,
  fulfilled_at TIMESTAMPTZ,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.episode_imaging_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  episode_id UUID NOT NULL REFERENCES public.patient_episodes(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Laudo de imagem',
  body_text TEXT NOT NULL DEFAULT '',
  reported_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_episode_lab_values_episode_collected
  ON public.episode_lab_values(episode_id, collected_at DESC);

CREATE INDEX IF NOT EXISTS idx_episode_lab_values_analyte
  ON public.episode_lab_values(episode_id, analyte_key, collected_at DESC);

CREATE INDEX IF NOT EXISTS idx_episode_lab_pending_episode
  ON public.episode_lab_pending(episode_id, fulfilled_at);

CREATE INDEX IF NOT EXISTS idx_episode_lab_pending_open
  ON public.episode_lab_pending(fulfilled_at)
  WHERE fulfilled_at IS NULL;

ALTER TABLE public.episode_lab_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.episode_lab_pending ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.episode_imaging_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Org vê exames lab" ON public.episode_lab_values;
CREATE POLICY "Org vê exames lab"
  ON public.episode_lab_values FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.patient_episodes pe
      JOIN public.patients p ON p.id = pe.patient_id
      WHERE pe.id = episode_id AND public.user_belongs_to_admin(p.admin_id)
    )
  );

DROP POLICY IF EXISTS "Org cria exames lab" ON public.episode_lab_values;
CREATE POLICY "Org cria exames lab"
  ON public.episode_lab_values FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.patient_episodes pe
      JOIN public.patients p ON p.id = pe.patient_id
      WHERE pe.id = episode_id
        AND pe.archived_at IS NULL
        AND public.user_belongs_to_admin(p.admin_id)
    )
  );

DROP POLICY IF EXISTS "Org vê exames pendentes" ON public.episode_lab_pending;
CREATE POLICY "Org vê exames pendentes"
  ON public.episode_lab_pending FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.patient_episodes pe
      JOIN public.patients p ON p.id = pe.patient_id
      WHERE pe.id = episode_id AND public.user_belongs_to_admin(p.admin_id)
    )
  );

DROP POLICY IF EXISTS "Org cria exames pendentes" ON public.episode_lab_pending;
CREATE POLICY "Org cria exames pendentes"
  ON public.episode_lab_pending FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.patient_episodes pe
      JOIN public.patients p ON p.id = pe.patient_id
      WHERE pe.id = episode_id
        AND pe.archived_at IS NULL
        AND public.user_belongs_to_admin(p.admin_id)
    )
  );

DROP POLICY IF EXISTS "Org atualiza exames pendentes" ON public.episode_lab_pending;
CREATE POLICY "Org atualiza exames pendentes"
  ON public.episode_lab_pending FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.patient_episodes pe
      JOIN public.patients p ON p.id = pe.patient_id
      WHERE pe.id = episode_id
        AND pe.archived_at IS NULL
        AND public.user_belongs_to_admin(p.admin_id)
    )
  );

DROP POLICY IF EXISTS "Org vê laudos imagem" ON public.episode_imaging_reports;
CREATE POLICY "Org vê laudos imagem"
  ON public.episode_imaging_reports FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.patient_episodes pe
      JOIN public.patients p ON p.id = pe.patient_id
      WHERE pe.id = episode_id AND public.user_belongs_to_admin(p.admin_id)
    )
  );

DROP POLICY IF EXISTS "Org cria laudos imagem" ON public.episode_imaging_reports;
CREATE POLICY "Org cria laudos imagem"
  ON public.episode_imaging_reports FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.patient_episodes pe
      JOIN public.patients p ON p.id = pe.patient_id
      WHERE pe.id = episode_id
        AND pe.archived_at IS NULL
        AND public.user_belongs_to_admin(p.admin_id)
    )
  );
