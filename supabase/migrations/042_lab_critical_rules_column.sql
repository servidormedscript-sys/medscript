ALTER TABLE public.organization_clinical_rule_sets
  ADD COLUMN IF NOT EXISTS lab_critical_rules JSONB NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.organization_clinical_rule_sets.lab_critical_rules IS
  'Condutas críticas por exame (PDF 2.4 / 5.14), versionadas por organização.';
