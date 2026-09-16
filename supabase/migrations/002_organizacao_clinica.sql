-- ============================================================
-- MEDScript — Organização Clínica (migration 002)
-- Cole este SQL no SQL Editor do Supabase APÓS a migration 001
-- ============================================================

-- ============================================================
-- 1. Atualizar tabela profiles
-- ============================================================
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS user_type TEXT CHECK (user_type IN ('plantonista', 'estudante')),
  ADD COLUMN IF NOT EXISTS parent_admin_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('admin', 'member', 'doctor', 'receptionist'));

CREATE INDEX IF NOT EXISTS idx_profiles_parent_admin
  ON public.profiles(parent_admin_id);

-- ============================================================
-- 2. Tabela de equipes / organizações
-- ============================================================
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  admin_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.organizations IS 'Equipes criadas pelo administrador da clínica';

-- ============================================================
-- 3. Membros das equipes
-- ============================================================
CREATE TABLE IF NOT EXISTS public.organization_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, profile_id)
);

COMMENT ON TABLE public.organization_members IS 'Vínculo entre sub-usuários e equipes';

-- ============================================================
-- 4. Trigger updated_at para novas tabelas
-- ============================================================
DROP TRIGGER IF EXISTS organizations_updated_at ON public.organizations;
CREATE TRIGGER organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- ============================================================
-- 5. Atualizar trigger de novo usuário (admin no cadastro Google)
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    avatar_url,
    role,
    user_type,
    parent_admin_id,
    phone
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url',
    COALESCE(NEW.raw_user_meta_data->>'role', 'admin'),
    NEW.raw_user_meta_data->>'user_type',
    NULLIF(NEW.raw_user_meta_data->>'parent_admin_id', '')::uuid,
    NEW.raw_user_meta_data->>'phone'
  );

  -- Assinatura trial apenas para administradores (conta principal)
  IF COALESCE(NEW.raw_user_meta_data->>'role', 'admin') = 'admin' THEN
    INSERT INTO public.subscriptions (user_id)
    VALUES (NEW.id);
  END IF;

  RETURN NEW;
END;
$$;

-- ============================================================
-- 6. Promover usuários existentes a admin (se ainda forem 'user')
-- ============================================================
UPDATE public.profiles
SET role = 'admin'
WHERE role = 'user' AND parent_admin_id IS NULL;

-- ============================================================
-- 7. Row Level Security
-- ============================================================
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

-- Admin vê sub-usuários que criou
DROP POLICY IF EXISTS "Admin vê sub-usuários" ON public.profiles;
CREATE POLICY "Admin vê sub-usuários"
  ON public.profiles FOR SELECT
  USING (
    auth.uid() = id
    OR parent_admin_id = auth.uid()
  );

DROP POLICY IF EXISTS "Admin gerencia sub-usuários" ON public.profiles;
CREATE POLICY "Admin gerencia sub-usuários"
  ON public.profiles FOR UPDATE
  USING (parent_admin_id = auth.uid());

-- Organizações: admin gerencia as suas
DROP POLICY IF EXISTS "Admin vê suas equipes" ON public.organizations;
CREATE POLICY "Admin vê suas equipes"
  ON public.organizations FOR SELECT
  USING (admin_id = auth.uid());

DROP POLICY IF EXISTS "Admin cria equipes" ON public.organizations;
CREATE POLICY "Admin cria equipes"
  ON public.organizations FOR INSERT
  WITH CHECK (admin_id = auth.uid());

DROP POLICY IF EXISTS "Admin atualiza equipes" ON public.organizations;
CREATE POLICY "Admin atualiza equipes"
  ON public.organizations FOR UPDATE
  USING (admin_id = auth.uid());

DROP POLICY IF EXISTS "Admin exclui equipes" ON public.organizations;
CREATE POLICY "Admin exclui equipes"
  ON public.organizations FOR DELETE
  USING (admin_id = auth.uid());

-- Membros: admin gerencia membros das suas equipes
DROP POLICY IF EXISTS "Admin vê membros das equipes" ON public.organization_members;
CREATE POLICY "Admin vê membros das equipes"
  ON public.organization_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.organizations o
      WHERE o.id = organization_id AND o.admin_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admin adiciona membros" ON public.organization_members;
CREATE POLICY "Admin adiciona membros"
  ON public.organization_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.organizations o
      WHERE o.id = organization_id AND o.admin_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = profile_id AND p.parent_admin_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admin remove membros" ON public.organization_members;
CREATE POLICY "Admin remove membros"
  ON public.organization_members FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.organizations o
      WHERE o.id = organization_id AND o.admin_id = auth.uid()
    )
  );

-- ============================================================
-- 8. Índices
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_organizations_admin_id ON public.organizations(admin_id);
CREATE INDEX IF NOT EXISTS idx_organization_members_org ON public.organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_members_profile ON public.organization_members(profile_id);
