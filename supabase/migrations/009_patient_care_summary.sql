-- ============================================================
-- MEDScript — Resumo dos Pacientes (migration 009)
-- Cole este SQL no SQL Editor APÓS a migration 008
-- ============================================================

DO $$ BEGIN
  CREATE TYPE public.patient_care_item_type AS ENUM ('exame', 'medicamento');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.patient_exam_status AS ENUM ('pendente', 'realizado', 'cancelado');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.patient_care_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  episode_id UUID NOT NULL REFERENCES public.patient_episodes(id) ON DELETE CASCADE,
  admin_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  item_type public.patient_care_item_type NOT NULL,
  title TEXT NOT NULL,
  notes TEXT,
  exam_status public.patient_exam_status,
  scheduled_for TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  schedule_times TEXT[] NOT NULL DEFAULT '{}',
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT patient_care_items_exam_status_check CHECK (
    (item_type = 'exame' AND exam_status IS NOT NULL)
    OR (item_type = 'medicamento' AND exam_status IS NULL)
  ),
  CONSTRAINT patient_care_items_title_check CHECK (btrim(title) <> '')
);

CREATE TABLE IF NOT EXISTS public.patient_medication_doses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  care_item_id UUID NOT NULL REFERENCES public.patient_care_items(id) ON DELETE CASCADE,
  dose_date DATE NOT NULL DEFAULT CURRENT_DATE,
  schedule_time TEXT NOT NULL,
  taken_at TIMESTAMPTZ,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (care_item_id, dose_date, schedule_time)
);

COMMENT ON TABLE public.patient_care_items IS 'Solicitações de exames e medicamentos do resumo do paciente';
COMMENT ON TABLE public.patient_medication_doses IS 'Registro diário de horários de medicação';

CREATE INDEX IF NOT EXISTS idx_patient_care_items_episode
  ON public.patient_care_items(episode_id, item_type);

CREATE INDEX IF NOT EXISTS idx_patient_medication_doses_item_date
  ON public.patient_medication_doses(care_item_id, dose_date);

DROP TRIGGER IF EXISTS patient_care_items_updated_at ON public.patient_care_items;
CREATE TRIGGER patient_care_items_updated_at
  BEFORE UPDATE ON public.patient_care_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.patient_care_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_medication_doses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Org vê resumo paciente" ON public.patient_care_items;
CREATE POLICY "Org vê resumo paciente"
  ON public.patient_care_items FOR SELECT
  USING (public.user_belongs_to_admin(admin_id));

DROP POLICY IF EXISTS "Org cria resumo paciente" ON public.patient_care_items;
CREATE POLICY "Org cria resumo paciente"
  ON public.patient_care_items FOR INSERT
  WITH CHECK (public.user_belongs_to_admin(admin_id));

DROP POLICY IF EXISTS "Org atualiza resumo paciente" ON public.patient_care_items;
CREATE POLICY "Org atualiza resumo paciente"
  ON public.patient_care_items FOR UPDATE
  USING (public.user_belongs_to_admin(admin_id));

DROP POLICY IF EXISTS "Org remove resumo paciente" ON public.patient_care_items;
CREATE POLICY "Org remove resumo paciente"
  ON public.patient_care_items FOR DELETE
  USING (public.user_belongs_to_admin(admin_id));

DROP POLICY IF EXISTS "Org vê doses medicamento" ON public.patient_medication_doses;
CREATE POLICY "Org vê doses medicamento"
  ON public.patient_medication_doses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.patient_care_items pci
      WHERE pci.id = care_item_id
        AND public.user_belongs_to_admin(pci.admin_id)
    )
  );

DROP POLICY IF EXISTS "Org registra doses medicamento" ON public.patient_medication_doses;
CREATE POLICY "Org registra doses medicamento"
  ON public.patient_medication_doses FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.patient_care_items pci
      WHERE pci.id = care_item_id
        AND public.user_belongs_to_admin(pci.admin_id)
    )
  );

DROP POLICY IF EXISTS "Org atualiza doses medicamento" ON public.patient_medication_doses;
CREATE POLICY "Org atualiza doses medicamento"
  ON public.patient_medication_doses FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.patient_care_items pci
      WHERE pci.id = care_item_id
        AND public.user_belongs_to_admin(pci.admin_id)
    )
  );

DROP POLICY IF EXISTS "Org remove doses medicamento" ON public.patient_medication_doses;
CREATE POLICY "Org remove doses medicamento"
  ON public.patient_medication_doses FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.patient_care_items pci
      WHERE pci.id = care_item_id
        AND public.user_belongs_to_admin(pci.admin_id)
    )
  );
