-- ============================================================
-- MEDScript — Leitos físicos + especialidade de internação (Fase 6)
-- ============================================================

DO $$ BEGIN
  CREATE TYPE public.organization_bed_status AS ENUM (
    'livre',
    'ocupado',
    'higienizacao',
    'bloqueado'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.organization_beds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  unit TEXT NOT NULL DEFAULT '',
  status public.organization_bed_status NOT NULL DEFAULT 'livre',
  episode_id UUID REFERENCES public.patient_episodes(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT organization_beds_code_unit_unique UNIQUE (admin_id, unit, code)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_organization_beds_episode_unique
  ON public.organization_beds(episode_id)
  WHERE episode_id IS NOT NULL;

COMMENT ON TABLE public.organization_beds IS
  'Leitos físicos da clínica (mapa de leitos)';

ALTER TABLE public.patient_episodes
  ADD COLUMN IF NOT EXISTS care_specialty TEXT,
  ADD COLUMN IF NOT EXISTS organization_bed_id UUID REFERENCES public.organization_beds(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.patient_episodes.care_specialty IS
  'Especialidade assistencial (chave fixa; ver lib/inpatient/specialty.ts)';

DROP TRIGGER IF EXISTS organization_beds_updated_at ON public.organization_beds;
CREATE TRIGGER organization_beds_updated_at
  BEFORE UPDATE ON public.organization_beds
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.organization_beds ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Org vê leitos" ON public.organization_beds;
CREATE POLICY "Org vê leitos"
  ON public.organization_beds FOR SELECT
  USING (public.user_belongs_to_admin(admin_id));

DROP POLICY IF EXISTS "Org cria leitos" ON public.organization_beds;
CREATE POLICY "Org cria leitos"
  ON public.organization_beds FOR INSERT
  WITH CHECK (public.user_belongs_to_admin(admin_id));

DROP POLICY IF EXISTS "Org atualiza leitos" ON public.organization_beds;
CREATE POLICY "Org atualiza leitos"
  ON public.organization_beds FOR UPDATE
  USING (public.user_belongs_to_admin(admin_id));

DROP POLICY IF EXISTS "Org exclui leitos" ON public.organization_beds;
CREATE POLICY "Org exclui leitos"
  ON public.organization_beds FOR DELETE
  USING (public.user_belongs_to_admin(admin_id));

CREATE INDEX IF NOT EXISTS idx_organization_beds_admin_unit
  ON public.organization_beds(admin_id, unit);
