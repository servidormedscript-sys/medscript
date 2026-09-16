-- ============================================================
-- MEDScript — Observações e registro de conclusão (migration 011)
-- Cole este SQL no SQL Editor APÓS a migration 010
-- ============================================================

ALTER TABLE public.patient_medication_doses
  ADD COLUMN IF NOT EXISTS notes TEXT;

ALTER TABLE public.patient_care_items
  ADD COLUMN IF NOT EXISTS completion_notes TEXT;

COMMENT ON COLUMN public.patient_medication_doses.notes IS
  'Observações registradas no momento da tomada do medicamento';

COMMENT ON COLUMN public.patient_care_items.completion_notes IS
  'Observações sobre o resultado ou conclusão do exame';
