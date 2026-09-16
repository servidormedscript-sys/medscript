-- ============================================================
-- MEDScript — T0 avulsa (migration 006)
-- Cole este SQL no SQL Editor APÓS a migration 005
-- ============================================================

ALTER TABLE public.clinical_assessments
  ALTER COLUMN episode_id DROP NOT NULL;

ALTER TABLE public.clinical_assessments
  ADD COLUMN IF NOT EXISTS admin_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS is_standalone BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.clinical_assessments
  DROP CONSTRAINT IF EXISTS clinical_assessments_standalone_check;

ALTER TABLE public.clinical_assessments
  ADD CONSTRAINT clinical_assessments_standalone_check CHECK (
    (
      is_standalone = false
      AND episode_id IS NOT NULL
      AND title IS NULL
    )
    OR (
      is_standalone = true
      AND episode_id IS NULL
      AND admin_id IS NOT NULL
      AND title IS NOT NULL
      AND btrim(title) <> ''
    )
  );

CREATE INDEX IF NOT EXISTS idx_clinical_assessments_standalone
  ON public.clinical_assessments(admin_id, created_at DESC)
  WHERE is_standalone = true;

COMMENT ON COLUMN public.clinical_assessments.title IS 'Título identificador para T0 avulsa';
COMMENT ON COLUMN public.clinical_assessments.is_standalone IS 'T0 sem paciente vinculado';

DROP POLICY IF EXISTS "Org vê avaliações clínicas" ON public.clinical_assessments;
CREATE POLICY "Org vê avaliações clínicas"
  ON public.clinical_assessments FOR SELECT
  USING (
    (
      is_standalone = true
      AND admin_id IS NOT NULL
      AND public.user_belongs_to_admin(admin_id)
    )
    OR (
      episode_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM public.patient_episodes pe
        JOIN public.patients p ON p.id = pe.patient_id
        WHERE pe.id = episode_id AND public.user_belongs_to_admin(p.admin_id)
      )
    )
  );

DROP POLICY IF EXISTS "Org cria avaliações clínicas" ON public.clinical_assessments;
CREATE POLICY "Org cria avaliações clínicas"
  ON public.clinical_assessments FOR INSERT
  WITH CHECK (
    (
      is_standalone = true
      AND admin_id IS NOT NULL
      AND public.user_belongs_to_admin(admin_id)
    )
    OR (
      is_standalone = false
      AND episode_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM public.patient_episodes pe
        JOIN public.patients p ON p.id = pe.patient_id
        WHERE pe.id = episode_id
          AND pe.archived_at IS NULL
          AND public.user_belongs_to_admin(p.admin_id)
      )
    )
  );
