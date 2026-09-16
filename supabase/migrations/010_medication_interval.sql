-- ============================================================
-- MEDScript — Intervalo automático de medicamentos (migration 010)
-- Cole este SQL no SQL Editor APÓS a migration 009
-- ============================================================

ALTER TABLE public.patient_care_items
  ADD COLUMN IF NOT EXISTS dose_interval_hours INTEGER,
  ADD COLUMN IF NOT EXISTS last_dose_at TIMESTAMPTZ;

COMMENT ON COLUMN public.patient_care_items.dose_interval_hours IS
  'Intervalo entre doses do medicamento, em horas (ex.: 4 = a cada 4 horas)';

COMMENT ON COLUMN public.patient_care_items.last_dose_at IS
  'Data/hora da última dose registrada (base para calcular a próxima)';

ALTER TABLE public.patient_care_items
  DROP CONSTRAINT IF EXISTS patient_care_items_dose_interval_check;

ALTER TABLE public.patient_care_items
  ADD CONSTRAINT patient_care_items_dose_interval_check CHECK (
    item_type <> 'medicamento'
    OR dose_interval_hours IS NULL
    OR dose_interval_hours IN (1, 2, 4, 6, 8, 12, 24)
  );
