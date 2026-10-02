-- ============================================================
-- MEDScript — AIH/Internação: finalização (documento imutável)
-- ============================================================

ALTER TABLE public.episode_internacao
  ADD COLUMN IF NOT EXISTS finalized_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS finalized_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.episode_internacao.finalized_at IS
  'Após finalizar, o documento de internação/AIH não pode ser editado (exceto leitura).';

DROP POLICY IF EXISTS "Org atualiza internação" ON public.episode_internacao;
CREATE POLICY "Org atualiza internação"
  ON public.episode_internacao FOR UPDATE
  USING (
    finalized_at IS NULL
    AND EXISTS (
      SELECT 1 FROM public.patient_episodes pe
      JOIN public.patients p ON p.id = pe.patient_id
      WHERE pe.id = episode_id AND public.user_belongs_to_admin(p.admin_id)
    )
  )
  WITH CHECK (finalized_at IS NULL);
