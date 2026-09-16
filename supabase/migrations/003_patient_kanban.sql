-- ============================================================
-- MEDScript — Kanban de Pacientes (migration 003)
-- Cole este SQL no SQL Editor do Supabase APÓS a migration 002
-- ============================================================

-- ============================================================
-- 1. Tipos enumerados
-- ============================================================
DO $$ BEGIN
  CREATE TYPE public.patient_status AS ENUM (
    'triagem',
    'em_observacao',
    'internado',
    'alta_recente',
    'arquivado'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.risk_level AS ENUM ('alto', 'medio', 'baixo');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- 2. Pacientes (cadastro mestre)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.patients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  cpf TEXT NOT NULL,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (admin_id, cpf)
);

COMMENT ON TABLE public.patients IS 'Cadastro mestre de pacientes por clínica/administrador';

-- ============================================================
-- 3. Episódios / fichas (cada período de atendimento)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.patient_episodes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  episode_number INTEGER NOT NULL,
  status public.patient_status NOT NULL DEFAULT 'triagem',
  weight TEXT,
  bed TEXT,
  allergies TEXT,
  medications TEXT,
  risk_level public.risk_level,
  alta_days INTEGER,
  alta_started_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (patient_id, episode_number)
);

COMMENT ON TABLE public.patient_episodes IS 'Ficha/episódio de atendimento do paciente';

-- ============================================================
-- 4. Movimentações e relatórios do Kanban
-- ============================================================
CREATE TABLE IF NOT EXISTS public.patient_movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  episode_id UUID NOT NULL REFERENCES public.patient_episodes(id) ON DELETE CASCADE,
  from_status public.patient_status,
  to_status public.patient_status NOT NULL,
  report_text TEXT NOT NULL DEFAULT '',
  risk_level public.risk_level,
  alta_days INTEGER,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.patient_movements IS 'Histórico de movimentações e relatórios por episódio';

-- ============================================================
-- 5. Triggers updated_at
-- ============================================================
DROP TRIGGER IF EXISTS patients_updated_at ON public.patients;
CREATE TRIGGER patients_updated_at
  BEFORE UPDATE ON public.patients
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS patient_episodes_updated_at ON public.patient_episodes;
CREATE TRIGGER patient_episodes_updated_at
  BEFORE UPDATE ON public.patient_episodes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- ============================================================
-- 6. Função: arquivar pacientes com alta expirada
-- ============================================================
CREATE OR REPLACE FUNCTION public.archive_expired_alta_patients()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  affected INTEGER := 0;
BEGIN
  WITH expired AS (
    SELECT pe.id AS episode_id, pe.patient_id
    FROM public.patient_episodes pe
    WHERE pe.status = 'alta_recente'
      AND pe.alta_started_at IS NOT NULL
      AND pe.alta_days IS NOT NULL
      AND pe.archived_at IS NULL
      AND (pe.alta_started_at + (pe.alta_days || ' days')::interval) <= NOW()
  ),
  updated_episodes AS (
    UPDATE public.patient_episodes pe
    SET
      status = 'arquivado',
      archived_at = NOW(),
      updated_at = NOW()
    FROM expired e
    WHERE pe.id = e.episode_id
    RETURNING pe.patient_id
  )
  UPDATE public.patients p
  SET
    is_archived = true,
    updated_at = NOW()
  FROM updated_episodes ue
  WHERE p.id = ue.patient_id;

  GET DIAGNOSTICS affected = ROW_COUNT;
  RETURN affected;
END;
$$;

-- ============================================================
-- 7. Helper: verificar se usuário pertence à organização
-- ============================================================
CREATE OR REPLACE FUNCTION public.user_belongs_to_admin(target_admin_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
      AND (p.id = target_admin_id OR p.parent_admin_id = target_admin_id)
  );
$$;

-- ============================================================
-- 8. Row Level Security
-- ============================================================
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_episodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_movements ENABLE ROW LEVEL SECURITY;

-- Pacientes
DROP POLICY IF EXISTS "Org vê pacientes" ON public.patients;
CREATE POLICY "Org vê pacientes"
  ON public.patients FOR SELECT
  USING (public.user_belongs_to_admin(admin_id));

DROP POLICY IF EXISTS "Org cria pacientes" ON public.patients;
CREATE POLICY "Org cria pacientes"
  ON public.patients FOR INSERT
  WITH CHECK (public.user_belongs_to_admin(admin_id));

DROP POLICY IF EXISTS "Org atualiza pacientes" ON public.patients;
CREATE POLICY "Org atualiza pacientes"
  ON public.patients FOR UPDATE
  USING (public.user_belongs_to_admin(admin_id));

-- Episódios
DROP POLICY IF EXISTS "Org vê episódios" ON public.patient_episodes;
CREATE POLICY "Org vê episódios"
  ON public.patient_episodes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.patients p
      WHERE p.id = patient_id AND public.user_belongs_to_admin(p.admin_id)
    )
  );

DROP POLICY IF EXISTS "Org cria episódios" ON public.patient_episodes;
CREATE POLICY "Org cria episódios"
  ON public.patient_episodes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.patients p
      WHERE p.id = patient_id AND public.user_belongs_to_admin(p.admin_id)
    )
  );

DROP POLICY IF EXISTS "Org atualiza episódios" ON public.patient_episodes;
CREATE POLICY "Org atualiza episódios"
  ON public.patient_episodes FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.patients p
      WHERE p.id = patient_id AND public.user_belongs_to_admin(p.admin_id)
    )
  );

-- Movimentações
DROP POLICY IF EXISTS "Org vê movimentações" ON public.patient_movements;
CREATE POLICY "Org vê movimentações"
  ON public.patient_movements FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.patient_episodes pe
      JOIN public.patients p ON p.id = pe.patient_id
      WHERE pe.id = episode_id AND public.user_belongs_to_admin(p.admin_id)
    )
  );

DROP POLICY IF EXISTS "Org cria movimentações" ON public.patient_movements;
CREATE POLICY "Org cria movimentações"
  ON public.patient_movements FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.patient_episodes pe
      JOIN public.patients p ON p.id = pe.patient_id
      WHERE pe.id = episode_id AND public.user_belongs_to_admin(p.admin_id)
    )
  );

-- ============================================================
-- 9. Índices
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_patients_admin_id ON public.patients(admin_id);
CREATE INDEX IF NOT EXISTS idx_patients_cpf ON public.patients(cpf);
CREATE INDEX IF NOT EXISTS idx_patients_archived ON public.patients(is_archived);
CREATE INDEX IF NOT EXISTS idx_patient_episodes_patient ON public.patient_episodes(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_episodes_status ON public.patient_episodes(status);
CREATE INDEX IF NOT EXISTS idx_patient_movements_episode ON public.patient_movements(episode_id);
