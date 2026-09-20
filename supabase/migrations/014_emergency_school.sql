-- Progresso individual na trilha da Escola de Emergência

CREATE TABLE IF NOT EXISTS public.emergency_school_module_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  module_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('in_progress', 'completed')),
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (profile_id, module_id)
);

CREATE INDEX IF NOT EXISTS idx_escola_progress_profile
  ON public.emergency_school_module_progress (profile_id);

ALTER TABLE public.emergency_school_module_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "escola_progress_select_own"
  ON public.emergency_school_module_progress
  FOR SELECT
  TO authenticated
  USING (profile_id = auth.uid());

CREATE POLICY "escola_progress_insert_own"
  ON public.emergency_school_module_progress
  FOR INSERT
  TO authenticated
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "escola_progress_update_own"
  ON public.emergency_school_module_progress
  FOR UPDATE
  TO authenticated
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "escola_progress_delete_own"
  ON public.emergency_school_module_progress
  FOR DELETE
  TO authenticated
  USING (profile_id = auth.uid());

COMMENT ON TABLE public.emergency_school_module_progress IS
  'Progresso do usuário nos módulos da Escola de Emergência';
