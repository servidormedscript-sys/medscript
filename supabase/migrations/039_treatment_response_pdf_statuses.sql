-- PDF 5.6: melhora parcial e sem resposta
ALTER TABLE public.episode_treatment_responses
  DROP CONSTRAINT IF EXISTS episode_treatment_responses_response_status_check;

ALTER TABLE public.episode_treatment_responses
  ADD CONSTRAINT episode_treatment_responses_response_status_check
  CHECK (
    response_status IN (
      'melhora',
      'melhora_parcial',
      'sem_mudanca',
      'sem_resposta',
      'piora'
    )
  );

ALTER TABLE public.episode_treatment_responses
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

UPDATE public.episode_treatment_responses
SET updated_at = created_at
WHERE updated_at IS NULL;
