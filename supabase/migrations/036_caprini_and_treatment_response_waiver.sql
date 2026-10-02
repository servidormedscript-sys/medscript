-- ============================================================
-- MEDScript — Caprini (TEV) + dispensa resposta ao tratamento (5.3)
-- ============================================================

ALTER TABLE public.episode_general_orders
  ADD COLUMN IF NOT EXISTS caprini_score JSONB NOT NULL DEFAULT '{}';

ALTER TABLE public.episode_conduct
  ADD COLUMN IF NOT EXISTS no_treatment_response_waiver BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN public.episode_conduct.no_treatment_response_waiver IS
  'Médico declara que não há necessidade de registrar resposta ao tratamento por problema (regulação/CORE).';
