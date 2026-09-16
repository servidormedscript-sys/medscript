-- ============================================================
-- MEDScript — Campos expandidos de cadastro (migration 004)
-- Cole este SQL no SQL Editor APÓS a migration 003
-- ============================================================

ALTER TABLE public.patients
  ADD COLUMN IF NOT EXISTS birth_date DATE,
  ADD COLUMN IF NOT EXISTS sex TEXT CHECK (sex IN ('masculino', 'feminino', 'outro'));

ALTER TABLE public.patient_episodes
  ADD COLUMN IF NOT EXISTS diagnosis TEXT,
  ADD COLUMN IF NOT EXISTS initial_assessment TEXT;

COMMENT ON COLUMN public.patients.birth_date IS 'Data de nascimento do paciente';
COMMENT ON COLUMN public.patients.sex IS 'Sexo do paciente';
COMMENT ON COLUMN public.patient_episodes.diagnosis IS 'Diagnóstico ou motivo de internação';
COMMENT ON COLUMN public.patient_episodes.initial_assessment IS 'Avaliação inicial (TO)';
