ALTER TABLE public.episode_treatment_responses
  ADD COLUMN IF NOT EXISTS other_measure TEXT NOT NULL DEFAULT '';

COMMENT ON COLUMN public.episode_treatment_responses.other_measure IS
  'Outra medida terapêutica (PDF 5.6), além das prescrições vinculadas.';
