-- ============================================================
-- MEDScript — Conduta: ausência explícita de tratamento (regulação)
-- ============================================================

ALTER TABLE public.episode_conduct
  ADD COLUMN IF NOT EXISTS no_specific_treatment BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.episode_conduct.no_specific_treatment IS
  'Marcado quando não há prescrição/conduta medicamentosa mas o médico confirma ausência intencional de tratamento específico.';

DROP POLICY IF EXISTS "Org exclui rascunho de evolução" ON public.episode_evolutions;
CREATE POLICY "Org exclui rascunho de evolução"
  ON public.episode_evolutions FOR DELETE
  USING (
    signed_at IS NULL
    AND EXISTS (
      SELECT 1 FROM public.patient_episodes pe
      JOIN public.patients p ON p.id = pe.patient_id
      WHERE pe.id = episode_id
        AND pe.archived_at IS NULL
        AND public.user_belongs_to_admin(p.admin_id)
    )
  );
