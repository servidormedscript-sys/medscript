-- ============================================================
-- MEDScript — Tempos por status no Kanban (migration 008)
-- Cole este SQL no SQL Editor APÓS a migration 007
-- ============================================================

ALTER TABLE public.patient_episodes
  ADD COLUMN IF NOT EXISTS status_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS triagem_seconds INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS observacao_seconds INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS internado_seconds INTEGER NOT NULL DEFAULT 0;

ALTER TABLE public.patient_movements
  ADD COLUMN IF NOT EXISTS duration_seconds INTEGER;

COMMENT ON COLUMN public.patient_episodes.status_started_at IS 'Início do período no status atual';
COMMENT ON COLUMN public.patient_episodes.triagem_seconds IS 'Tempo acumulado em triagem (segundos)';
COMMENT ON COLUMN public.patient_episodes.observacao_seconds IS 'Tempo acumulado em observação (segundos)';
COMMENT ON COLUMN public.patient_episodes.internado_seconds IS 'Tempo acumulado internado (segundos)';
COMMENT ON COLUMN public.patient_movements.duration_seconds IS 'Duração no status de origem antes desta movimentação';

-- Episódios existentes: iniciar contagem a partir da última atualização
UPDATE public.patient_episodes
SET status_started_at = COALESCE(status_started_at, updated_at, created_at)
WHERE status_started_at IS NULL;

ALTER TABLE public.patient_episodes
  ALTER COLUMN status_started_at SET DEFAULT NOW();

UPDATE public.patient_episodes
SET status_started_at = NOW()
WHERE status_started_at IS NULL;

ALTER TABLE public.patient_episodes
  ALTER COLUMN status_started_at SET NOT NULL;
