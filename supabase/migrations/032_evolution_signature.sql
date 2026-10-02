-- ============================================================
-- MEDScript — Evoluções assinadas (imutáveis após assinatura)
-- ============================================================

ALTER TABLE public.episode_evolutions
  ADD COLUMN IF NOT EXISTS signed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS signed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

UPDATE public.episode_evolutions
SET
  signed_at = created_at,
  signed_by = created_by
WHERE signed_at IS NULL;

COMMENT ON COLUMN public.episode_evolutions.signed_at IS
  'Quando preenchido, o conteúdo não pode ser alterado (documento assinado).';

DROP POLICY IF EXISTS "Org atualiza rascunho de evolução" ON public.episode_evolutions;
CREATE POLICY "Org atualiza rascunho de evolução"
  ON public.episode_evolutions FOR UPDATE
  USING (
    signed_at IS NULL
    AND EXISTS (
      SELECT 1 FROM public.patient_episodes pe
      JOIN public.patients p ON p.id = pe.patient_id
      WHERE pe.id = episode_id
        AND pe.archived_at IS NULL
        AND public.user_belongs_to_admin(p.admin_id)
    )
  )
  WITH CHECK (signed_at IS NULL);
