-- ============================================================
-- MEDScript — Documento AIH / Internação (Fase 9)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.episode_internacao (
  episode_id UUID PRIMARY KEY REFERENCES public.patient_episodes(id) ON DELETE CASCADE,
  summary_text TEXT NOT NULL DEFAULT '',
  orientations_text TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.episode_internacao ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Org vê internação" ON public.episode_internacao;
CREATE POLICY "Org vê internação"
  ON public.episode_internacao FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.patient_episodes pe
      JOIN public.patients p ON p.id = pe.patient_id
      WHERE pe.id = episode_id AND public.user_belongs_to_admin(p.admin_id)
    )
  );

DROP POLICY IF EXISTS "Org grava internação" ON public.episode_internacao;
CREATE POLICY "Org grava internação"
  ON public.episode_internacao FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.patient_episodes pe
      JOIN public.patients p ON p.id = pe.patient_id
      WHERE pe.id = episode_id AND public.user_belongs_to_admin(p.admin_id)
    )
  );

DROP POLICY IF EXISTS "Org atualiza internação" ON public.episode_internacao;
CREATE POLICY "Org atualiza internação"
  ON public.episode_internacao FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.patient_episodes pe
      JOIN public.patients p ON p.id = pe.patient_id
      WHERE pe.id = episode_id AND public.user_belongs_to_admin(p.admin_id)
    )
  );

DROP TRIGGER IF EXISTS episode_internacao_updated_at ON public.episode_internacao;
CREATE TRIGGER episode_internacao_updated_at
  BEFORE UPDATE ON public.episode_internacao
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();
