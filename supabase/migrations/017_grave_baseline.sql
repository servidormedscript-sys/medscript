-- Linha de base T0 (Meu Paciente Grave) por episódio
ALTER TABLE public.patient_episodes
  ADD COLUMN IF NOT EXISTS grave_baseline JSONB;

COMMENT ON COLUMN public.patient_episodes.grave_baseline IS
  'Snapshot T0 para comparação de evolução (MPG): vital, findings, topId, topScore, savedAt';
