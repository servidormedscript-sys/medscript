-- ============================================================
-- MEDScript — Documento de alta (Fase 8)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.episode_discharge (
  episode_id UUID PRIMARY KEY REFERENCES public.patient_episodes(id) ON DELETE CASCADE,
  summary_text TEXT NOT NULL DEFAULT '',
  orientations_text TEXT NOT NULL DEFAULT '',
  transfer_note TEXT NOT NULL DEFAULT '',
  confirmed_at TIMESTAMPTZ,
  confirmed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  alta_days INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.episode_discharge ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Org vê alta" ON public.episode_discharge;
CREATE POLICY "Org vê alta"
  ON public.episode_discharge FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.patient_episodes pe
      JOIN public.patients p ON p.id = pe.patient_id
      WHERE pe.id = episode_id AND public.user_belongs_to_admin(p.admin_id)
    )
  );

DROP POLICY IF EXISTS "Org grava alta" ON public.episode_discharge;
CREATE POLICY "Org grava alta"
  ON public.episode_discharge FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.patient_episodes pe
      JOIN public.patients p ON p.id = pe.patient_id
      WHERE pe.id = episode_id AND public.user_belongs_to_admin(p.admin_id)
    )
  );

DROP POLICY IF EXISTS "Org atualiza alta" ON public.episode_discharge;
CREATE POLICY "Org atualiza alta"
  ON public.episode_discharge FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.patient_episodes pe
      JOIN public.patients p ON p.id = pe.patient_id
      WHERE pe.id = episode_id AND public.user_belongs_to_admin(p.admin_id)
    )
  );

DROP TRIGGER IF EXISTS episode_discharge_updated_at ON public.episode_discharge;
CREATE TRIGGER episode_discharge_updated_at
  BEFORE UPDATE ON public.episode_discharge
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();
