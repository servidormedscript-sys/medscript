-- ============================================================
-- MEDScript — Lista de problemas e comorbidades (Resumo 2.9)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.episode_problems (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  episode_id UUID NOT NULL REFERENCES public.patient_episodes(id) ON DELETE CASCADE,
  text TEXT NOT NULL CHECK (btrim(text) <> ''),
  active BOOLEAN NOT NULL DEFAULT true,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_episode_problems_episode
  ON public.episode_problems(episode_id, active, started_at DESC);

CREATE TABLE IF NOT EXISTS public.episode_comorbidities (
  episode_id UUID PRIMARY KEY REFERENCES public.patient_episodes(id) ON DELETE CASCADE,
  flags JSONB NOT NULL DEFAULT '{}',
  other_text TEXT NOT NULL DEFAULT '',
  problems_seeded BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.episode_problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.episode_comorbidities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Org vê problemas" ON public.episode_problems;
CREATE POLICY "Org vê problemas"
  ON public.episode_problems FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.patient_episodes pe
      JOIN public.patients p ON p.id = pe.patient_id
      WHERE pe.id = episode_id AND public.user_belongs_to_admin(p.admin_id)
    )
  );

DROP POLICY IF EXISTS "Org grava problemas" ON public.episode_problems;
CREATE POLICY "Org grava problemas"
  ON public.episode_problems FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.patient_episodes pe
      JOIN public.patients p ON p.id = pe.patient_id
      WHERE pe.id = episode_id AND public.user_belongs_to_admin(p.admin_id)
    )
  );

DROP POLICY IF EXISTS "Org atualiza problemas" ON public.episode_problems;
CREATE POLICY "Org atualiza problemas"
  ON public.episode_problems FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.patient_episodes pe
      JOIN public.patients p ON p.id = pe.patient_id
      WHERE pe.id = episode_id AND public.user_belongs_to_admin(p.admin_id)
    )
  );

DROP POLICY IF EXISTS "Org exclui problemas" ON public.episode_problems;
CREATE POLICY "Org exclui problemas"
  ON public.episode_problems FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.patient_episodes pe
      JOIN public.patients p ON p.id = pe.patient_id
      WHERE pe.id = episode_id AND public.user_belongs_to_admin(p.admin_id)
    )
  );

DROP POLICY IF EXISTS "Org vê comorbidades" ON public.episode_comorbidities;
CREATE POLICY "Org vê comorbidades"
  ON public.episode_comorbidities FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.patient_episodes pe
      JOIN public.patients p ON p.id = pe.patient_id
      WHERE pe.id = episode_id AND public.user_belongs_to_admin(p.admin_id)
    )
  );

DROP POLICY IF EXISTS "Org grava comorbidades" ON public.episode_comorbidities;
CREATE POLICY "Org grava comorbidades"
  ON public.episode_comorbidities FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.patient_episodes pe
      JOIN public.patients p ON p.id = pe.patient_id
      WHERE pe.id = episode_id AND public.user_belongs_to_admin(p.admin_id)
    )
  );

DROP POLICY IF EXISTS "Org atualiza comorbidades" ON public.episode_comorbidities;
CREATE POLICY "Org atualiza comorbidades"
  ON public.episode_comorbidities FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.patient_episodes pe
      JOIN public.patients p ON p.id = pe.patient_id
      WHERE pe.id = episode_id AND public.user_belongs_to_admin(p.admin_id)
    )
  );

DROP TRIGGER IF EXISTS episode_comorbidities_updated_at ON public.episode_comorbidities;
CREATE TRIGGER episode_comorbidities_updated_at
  BEFORE UPDATE ON public.episode_comorbidities
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();
