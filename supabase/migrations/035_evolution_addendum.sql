-- ============================================================
-- MEDScript — Adendos a evoluções assinadas (5.15)
-- ============================================================

ALTER TABLE public.episode_evolutions
  ADD COLUMN IF NOT EXISTS addendum_of_id UUID REFERENCES public.episode_evolutions(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_episode_evolutions_addendum_of
  ON public.episode_evolutions(addendum_of_id)
  WHERE addendum_of_id IS NOT NULL;

COMMENT ON COLUMN public.episode_evolutions.addendum_of_id IS
  'Quando preenchido, este registro é adendo a uma evolução já assinada.';
