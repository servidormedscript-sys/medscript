-- ============================================================
-- MEDScript — Regulação / CORE (Parte 5 — campos na conduta)
-- ============================================================

ALTER TABLE public.episode_conduct
  ADD COLUMN IF NOT EXISTS resource_needed TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS unit_limitations JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS unit_limitation_other TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS core_status TEXT NOT NULL DEFAULT 'nenhum'
    CHECK (core_status IN ('nenhum', 'aguardando', 'autorizado', 'negado')),
  ADD COLUMN IF NOT EXISTS vaga_judicializada BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS judicial_started_at DATE,
  ADD COLUMN IF NOT EXISTS judicial_process TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS transfer_class TEXT NOT NULL DEFAULT 'sem'
    CHECK (transfer_class IN ('sem', 'prioritaria', 'urgente', 'emergencial')),
  ADD COLUMN IF NOT EXISTS transfer_class_justification TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS transfer_class_confirmed BOOLEAN NOT NULL DEFAULT false;
