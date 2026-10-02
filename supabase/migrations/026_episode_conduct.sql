-- ============================================================
-- MEDScript — Conduta, status de código e I-PASS (Fase 7)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.episode_conduct (
  episode_id UUID PRIMARY KEY REFERENCES public.patient_episodes(id) ON DELETE CASCADE,
  code_status TEXT NOT NULL DEFAULT 'reanimacao_plena'
    CHECK (code_status IN ('reanimacao_plena', 'onr', 'conforto')),
  code_justification TEXT,
  code_updated_at TIMESTAMPTZ,
  code_updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  conduct_text TEXT NOT NULL DEFAULT '',
  contingency_plan TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.episode_handoff_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  episode_id UUID NOT NULL REFERENCES public.patient_episodes(id) ON DELETE CASCADE,
  text TEXT NOT NULL CHECK (btrim(text) <> ''),
  completed BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_episode_handoff_tasks_episode
  ON public.episode_handoff_tasks(episode_id, completed, created_at DESC);

ALTER TABLE public.episode_conduct ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.episode_handoff_tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Org vê conduta" ON public.episode_conduct;
CREATE POLICY "Org vê conduta"
  ON public.episode_conduct FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.patient_episodes pe
      JOIN public.patients p ON p.id = pe.patient_id
      WHERE pe.id = episode_id AND public.user_belongs_to_admin(p.admin_id)
    )
  );

DROP POLICY IF EXISTS "Org grava conduta" ON public.episode_conduct;
CREATE POLICY "Org grava conduta"
  ON public.episode_conduct FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.patient_episodes pe
      JOIN public.patients p ON p.id = pe.patient_id
      WHERE pe.id = episode_id AND public.user_belongs_to_admin(p.admin_id)
    )
  );

DROP POLICY IF EXISTS "Org atualiza conduta" ON public.episode_conduct;
CREATE POLICY "Org atualiza conduta"
  ON public.episode_conduct FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.patient_episodes pe
      JOIN public.patients p ON p.id = pe.patient_id
      WHERE pe.id = episode_id AND public.user_belongs_to_admin(p.admin_id)
    )
  );

DROP POLICY IF EXISTS "Org vê tarefas passagem" ON public.episode_handoff_tasks;
CREATE POLICY "Org vê tarefas passagem"
  ON public.episode_handoff_tasks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.patient_episodes pe
      JOIN public.patients p ON p.id = pe.patient_id
      WHERE pe.id = episode_id AND public.user_belongs_to_admin(p.admin_id)
    )
  );

DROP POLICY IF EXISTS "Org cria tarefas passagem" ON public.episode_handoff_tasks;
CREATE POLICY "Org cria tarefas passagem"
  ON public.episode_handoff_tasks FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.patient_episodes pe
      JOIN public.patients p ON p.id = pe.patient_id
      WHERE pe.id = episode_id AND public.user_belongs_to_admin(p.admin_id)
    )
  );

DROP POLICY IF EXISTS "Org atualiza tarefas passagem" ON public.episode_handoff_tasks;
CREATE POLICY "Org atualiza tarefas passagem"
  ON public.episode_handoff_tasks FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.patient_episodes pe
      JOIN public.patients p ON p.id = pe.patient_id
      WHERE pe.id = episode_id AND public.user_belongs_to_admin(p.admin_id)
    )
  );

DROP POLICY IF EXISTS "Org exclui tarefas passagem" ON public.episode_handoff_tasks;
CREATE POLICY "Org exclui tarefas passagem"
  ON public.episode_handoff_tasks FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.patient_episodes pe
      JOIN public.patients p ON p.id = pe.patient_id
      WHERE pe.id = episode_id AND public.user_belongs_to_admin(p.admin_id)
    )
  );

DROP TRIGGER IF EXISTS episode_conduct_updated_at ON public.episode_conduct;
CREATE TRIGGER episode_conduct_updated_at
  BEFORE UPDATE ON public.episode_conduct
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();
