-- PDF 5.14 — regras de prescrição/dose versionadas por organização (admin)

CREATE TABLE IF NOT EXISTS public.organization_clinical_rule_sets (
  admin_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  rules_version TEXT NOT NULL DEFAULT '2026.10.08',
  rules JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

COMMENT ON TABLE public.organization_clinical_rule_sets IS
  'Tabelas versionadas de sugestão por diagnóstico (2.5 / 5.14) — editável sem deploy de código.';

CREATE INDEX IF NOT EXISTS idx_org_clinical_rules_updated
  ON public.organization_clinical_rule_sets(updated_at DESC);
