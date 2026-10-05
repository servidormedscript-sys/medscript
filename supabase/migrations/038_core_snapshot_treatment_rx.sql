-- ============================================================
-- MEDScript — snapshot CORE + medidas na resposta ao tratamento (5.6 / 5.8)
-- ============================================================

ALTER TABLE public.episode_core_generations
  ADD COLUMN IF NOT EXISTS clinical_snapshot JSONB;

ALTER TABLE public.episode_treatment_responses
  ADD COLUMN IF NOT EXISTS linked_prescription_ids JSONB NOT NULL DEFAULT '[]';

COMMENT ON COLUMN public.episode_core_generations.clinical_snapshot IS
  'Estado clínico estruturado no momento da geração CORE (diff Atualização CORE).';

COMMENT ON COLUMN public.episode_treatment_responses.linked_prescription_ids IS
  'IDs de prescrições ativas vinculadas à resposta do problema (5.6).';
