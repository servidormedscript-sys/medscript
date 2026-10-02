-- ============================================================
-- MEDScript — motivo do adendo de evolução (5.15)
-- ============================================================

ALTER TABLE public.episode_evolutions
  ADD COLUMN IF NOT EXISTS addendum_reason TEXT;

COMMENT ON COLUMN public.episode_evolutions.addendum_reason IS
  'Motivo declarado ao registrar adendo a evolução assinada (registro imutável 5.15).';
