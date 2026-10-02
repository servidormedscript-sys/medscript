-- ============================================================
-- MEDScript — Prontuário de internação (Fase 1: vitais + exame físico)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.episode_vital_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  episode_id UUID NOT NULL REFERENCES public.patient_episodes(id) ON DELETE CASCADE,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  pas SMALLINT,
  pad SMALLINT,
  fc SMALLINT,
  fr SMALLINT,
  spo2 SMALLINT,
  temperature NUMERIC(4, 1),
  glasgow SMALLINT,
  diurese_ml INTEGER,
  observation TEXT,
  o2_type TEXT NOT NULL DEFAULT 'ar_ambiente'
    CHECK (o2_type IN ('ar_ambiente', 'cateter', 'maf', 'vni', 'vm')),
  o2_flow_lmin NUMERIC(6, 1),
  central_venous_access BOOLEAN NOT NULL DEFAULT false,
  iot BOOLEAN NOT NULL DEFAULT false,
  monitoring BOOLEAN NOT NULL DEFAULT false,
  care_location TEXT NOT NULL DEFAULT 'enfermaria'
    CHECK (care_location IN ('enfermaria', 'emergencia', 'uti')),
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.episode_physical_exams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  episode_id UUID NOT NULL REFERENCES public.patient_episodes(id) ON DELETE CASCADE,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  without_changes BOOLEAN NOT NULL DEFAULT false,
  systems JSONB NOT NULL DEFAULT '{}',
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.episode_vital_records IS
  'Registros de sinais vitais e dispositivos do prontuário de internação';
COMMENT ON TABLE public.episode_physical_exams IS
  'Registros de exame físico por sistema do prontuário de internação';

CREATE INDEX IF NOT EXISTS idx_episode_vital_records_episode_recorded
  ON public.episode_vital_records(episode_id, recorded_at DESC);

CREATE INDEX IF NOT EXISTS idx_episode_physical_exams_episode_recorded
  ON public.episode_physical_exams(episode_id, recorded_at DESC);

ALTER TABLE public.episode_vital_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.episode_physical_exams ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Org vê vitais de internação" ON public.episode_vital_records;
CREATE POLICY "Org vê vitais de internação"
  ON public.episode_vital_records FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.patient_episodes pe
      JOIN public.patients p ON p.id = pe.patient_id
      WHERE pe.id = episode_id AND public.user_belongs_to_admin(p.admin_id)
    )
  );

DROP POLICY IF EXISTS "Org cria vitais de internação" ON public.episode_vital_records;
CREATE POLICY "Org cria vitais de internação"
  ON public.episode_vital_records FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.patient_episodes pe
      JOIN public.patients p ON p.id = pe.patient_id
      WHERE pe.id = episode_id
        AND pe.archived_at IS NULL
        AND public.user_belongs_to_admin(p.admin_id)
    )
  );

DROP POLICY IF EXISTS "Org vê exame físico de internação" ON public.episode_physical_exams;
CREATE POLICY "Org vê exame físico de internação"
  ON public.episode_physical_exams FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.patient_episodes pe
      JOIN public.patients p ON p.id = pe.patient_id
      WHERE pe.id = episode_id AND public.user_belongs_to_admin(p.admin_id)
    )
  );

DROP POLICY IF EXISTS "Org cria exame físico de internação" ON public.episode_physical_exams;
CREATE POLICY "Org cria exame físico de internação"
  ON public.episode_physical_exams FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.patient_episodes pe
      JOIN public.patients p ON p.id = pe.patient_id
      WHERE pe.id = episode_id
        AND pe.archived_at IS NULL
        AND public.user_belongs_to_admin(p.admin_id)
    )
  );
