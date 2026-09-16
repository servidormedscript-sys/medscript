-- ============================================================
-- MEDScript — Avaliação clínica T0 (migration 005)
-- Cole este SQL no SQL Editor APÓS a migration 004
-- ============================================================

CREATE TABLE IF NOT EXISTS public.clinical_assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  episode_id UUID NOT NULL REFERENCES public.patient_episodes(id) ON DELETE CASCADE,
  assessment_type TEXT NOT NULL DEFAULT 't0' CHECK (assessment_type IN ('t0')),
  vital_signs JSONB NOT NULL DEFAULT '{}',
  findings JSONB NOT NULL DEFAULT '{}',
  complementary JSONB NOT NULL DEFAULT '{}',
  suggestions JSONB NOT NULL DEFAULT '[]',
  summary TEXT NOT NULL DEFAULT '',
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.clinical_assessments IS 'Laudos de avaliação clínica inicial (T0) por episódio';

CREATE INDEX IF NOT EXISTS idx_clinical_assessments_episode
  ON public.clinical_assessments(episode_id);

ALTER TABLE public.clinical_assessments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Org vê avaliações clínicas" ON public.clinical_assessments;
CREATE POLICY "Org vê avaliações clínicas"
  ON public.clinical_assessments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.patient_episodes pe
      JOIN public.patients p ON p.id = pe.patient_id
      WHERE pe.id = episode_id AND public.user_belongs_to_admin(p.admin_id)
    )
  );

DROP POLICY IF EXISTS "Org cria avaliações clínicas" ON public.clinical_assessments;
CREATE POLICY "Org cria avaliações clínicas"
  ON public.clinical_assessments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.patient_episodes pe
      JOIN public.patients p ON p.id = pe.patient_id
      WHERE pe.id = episode_id
        AND pe.archived_at IS NULL
        AND public.user_belongs_to_admin(p.admin_id)
    )
  );
