-- ============================================================
-- MEDScript — Parte 5: timeline, gerações CORE, resposta ao tratamento
-- ============================================================

CREATE TABLE IF NOT EXISTS public.episode_timeline_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  episode_id UUID NOT NULL REFERENCES public.patient_episodes(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  summary_text TEXT NOT NULL DEFAULT '',
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  source_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_episode_timeline_episode
  ON public.episode_timeline_events(episode_id, occurred_at DESC);

CREATE TABLE IF NOT EXISTS public.episode_core_generations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  episode_id UUID NOT NULL REFERENCES public.patient_episodes(id) ON DELETE CASCADE,
  generation_kind TEXT NOT NULL
    CHECK (generation_kind IN ('core_inicial', 'core_atualizacao', 'judicializada')),
  content_html TEXT NOT NULL DEFAULT '',
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_episode_core_generations_episode
  ON public.episode_core_generations(episode_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.episode_treatment_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  episode_id UUID NOT NULL REFERENCES public.patient_episodes(id) ON DELETE CASCADE,
  problem_id UUID NOT NULL REFERENCES public.episode_problems(id) ON DELETE CASCADE,
  response_status TEXT NOT NULL
    CHECK (response_status IN ('melhora', 'sem_mudanca', 'piora')),
  notes TEXT NOT NULL DEFAULT '',
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_episode_treatment_response_problem
  ON public.episode_treatment_responses(problem_id);

ALTER TABLE public.episode_timeline_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.episode_core_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.episode_treatment_responses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Org vê timeline" ON public.episode_timeline_events;
CREATE POLICY "Org vê timeline"
  ON public.episode_timeline_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.patient_episodes pe
      JOIN public.patients p ON p.id = pe.patient_id
      WHERE pe.id = episode_id AND public.user_belongs_to_admin(p.admin_id)
    )
  );

DROP POLICY IF EXISTS "Org grava timeline" ON public.episode_timeline_events;
CREATE POLICY "Org grava timeline"
  ON public.episode_timeline_events FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.patient_episodes pe
      JOIN public.patients p ON p.id = pe.patient_id
      WHERE pe.id = episode_id AND public.user_belongs_to_admin(p.admin_id)
    )
  );

DROP POLICY IF EXISTS "Org vê core gerações" ON public.episode_core_generations;
CREATE POLICY "Org vê core gerações"
  ON public.episode_core_generations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.patient_episodes pe
      JOIN public.patients p ON p.id = pe.patient_id
      WHERE pe.id = episode_id AND public.user_belongs_to_admin(p.admin_id)
    )
  );

DROP POLICY IF EXISTS "Org grava core gerações" ON public.episode_core_generations;
CREATE POLICY "Org grava core gerações"
  ON public.episode_core_generations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.patient_episodes pe
      JOIN public.patients p ON p.id = pe.patient_id
      WHERE pe.id = episode_id AND public.user_belongs_to_admin(p.admin_id)
    )
  );

DROP POLICY IF EXISTS "Org vê resposta tratamento" ON public.episode_treatment_responses;
CREATE POLICY "Org vê resposta tratamento"
  ON public.episode_treatment_responses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.patient_episodes pe
      JOIN public.patients p ON p.id = pe.patient_id
      WHERE pe.id = episode_id AND public.user_belongs_to_admin(p.admin_id)
    )
  );

DROP POLICY IF EXISTS "Org grava resposta tratamento" ON public.episode_treatment_responses;
CREATE POLICY "Org grava resposta tratamento"
  ON public.episode_treatment_responses FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.patient_episodes pe
      JOIN public.patients p ON p.id = pe.patient_id
      WHERE pe.id = episode_id AND public.user_belongs_to_admin(p.admin_id)
    )
  );

DROP POLICY IF EXISTS "Org atualiza resposta tratamento" ON public.episode_treatment_responses;
CREATE POLICY "Org atualiza resposta tratamento"
  ON public.episode_treatment_responses FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.patient_episodes pe
      JOIN public.patients p ON p.id = pe.patient_id
      WHERE pe.id = episode_id AND public.user_belongs_to_admin(p.admin_id)
    )
  );
