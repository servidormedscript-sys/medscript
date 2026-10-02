-- ============================================================
-- MEDScript — Evoluções do prontuário de internação (Fase 2)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.episode_evolutions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  episode_id UUID NOT NULL REFERENCES public.patient_episodes(id) ON DELETE CASCADE,
  content_html TEXT NOT NULL DEFAULT '',
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.episode_evolutions IS
  'Evoluções médicas do prontuário (HTML formatado pelo editor interno)';

CREATE INDEX IF NOT EXISTS idx_episode_evolutions_episode_created
  ON public.episode_evolutions(episode_id, created_at DESC);

ALTER TABLE public.episode_evolutions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Org vê evoluções de internação" ON public.episode_evolutions;
CREATE POLICY "Org vê evoluções de internação"
  ON public.episode_evolutions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.patient_episodes pe
      JOIN public.patients p ON p.id = pe.patient_id
      WHERE pe.id = episode_id AND public.user_belongs_to_admin(p.admin_id)
    )
  );

DROP POLICY IF EXISTS "Org cria evoluções de internação" ON public.episode_evolutions;
CREATE POLICY "Org cria evoluções de internação"
  ON public.episode_evolutions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.patient_episodes pe
      JOIN public.patients p ON p.id = pe.patient_id
      WHERE pe.id = episode_id
        AND pe.archived_at IS NULL
        AND public.user_belongs_to_admin(p.admin_id)
    )
  );
