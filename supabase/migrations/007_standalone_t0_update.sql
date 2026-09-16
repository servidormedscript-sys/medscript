-- ============================================================
-- MEDScript — Atualização de T0 avulsa (migration 007)
-- Cole este SQL no SQL Editor APÓS a migration 006
-- ============================================================

DROP POLICY IF EXISTS "Org atualiza avaliações avulsas" ON public.clinical_assessments;
CREATE POLICY "Org atualiza avaliações avulsas"
  ON public.clinical_assessments FOR UPDATE
  USING (
    is_standalone = true
    AND admin_id IS NOT NULL
    AND public.user_belongs_to_admin(admin_id)
  )
  WITH CHECK (
    is_standalone = true
    AND admin_id IS NOT NULL
    AND public.user_belongs_to_admin(admin_id)
    AND title IS NOT NULL
    AND btrim(title) <> ''
  );
