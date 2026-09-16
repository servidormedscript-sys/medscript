-- ============================================================
-- MEDScript — Documentações, Plantões e Notificações (012)
-- Cole no SQL Editor do Supabase APÓS a migration 011
-- ============================================================

-- ============================================================
-- 1. Cards de documentação
-- ============================================================
CREATE TABLE IF NOT EXISTS public.documentation_cards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  is_protected BOOLEAN NOT NULL DEFAULT false,
  password_hash TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.documentation_cards IS 'Cards de documentação institucional por clínica';

-- ============================================================
-- 2. Arquivos anexados aos cards
-- ============================================================
CREATE TABLE IF NOT EXISTS public.documentation_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  card_id UUID NOT NULL REFERENCES public.documentation_cards(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  file_size BIGINT NOT NULL DEFAULT 0,
  mime_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.documentation_files IS 'Arquivos anexados a cards de documentação';

-- ============================================================
-- 3. Agenda de plantões
-- ============================================================
CREATE TABLE IF NOT EXISTS public.shift_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  shift_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  notes TEXT NOT NULL DEFAULT '',
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.shift_schedules IS 'Plantões agendados pelo admin da clínica para sub-usuários';

-- ============================================================
-- 4. Notificações in-app
-- ============================================================
CREATE TABLE IF NOT EXISTS public.user_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL DEFAULT 'shift_assigned',
  title TEXT NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  payload JSONB NOT NULL DEFAULT '{}',
  read_at TIMESTAMPTZ,
  dismissed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.user_notifications IS 'Notificações do sistema para usuários';

-- ============================================================
-- 5. Triggers updated_at
-- ============================================================
DROP TRIGGER IF EXISTS documentation_cards_updated_at ON public.documentation_cards;
CREATE TRIGGER documentation_cards_updated_at
  BEFORE UPDATE ON public.documentation_cards
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS shift_schedules_updated_at ON public.shift_schedules;
CREATE TRIGGER shift_schedules_updated_at
  BEFORE UPDATE ON public.shift_schedules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- ============================================================
-- 6. Row Level Security
-- ============================================================
ALTER TABLE public.documentation_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documentation_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shift_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;

-- Documentação: org vê cards; só admin da clínica gerencia
DROP POLICY IF EXISTS "Org vê cards de documentação" ON public.documentation_cards;
CREATE POLICY "Org vê cards de documentação"
  ON public.documentation_cards FOR SELECT
  USING (public.user_belongs_to_admin(admin_id));

DROP POLICY IF EXISTS "Admin cria cards de documentação" ON public.documentation_cards;
CREATE POLICY "Admin cria cards de documentação"
  ON public.documentation_cards FOR INSERT
  WITH CHECK (admin_id = auth.uid());

DROP POLICY IF EXISTS "Admin atualiza cards de documentação" ON public.documentation_cards;
CREATE POLICY "Admin atualiza cards de documentação"
  ON public.documentation_cards FOR UPDATE
  USING (admin_id = auth.uid());

DROP POLICY IF EXISTS "Admin exclui cards de documentação" ON public.documentation_cards;
CREATE POLICY "Admin exclui cards de documentação"
  ON public.documentation_cards FOR DELETE
  USING (admin_id = auth.uid());

-- Arquivos de documentação
DROP POLICY IF EXISTS "Org vê arquivos de documentação" ON public.documentation_files;
CREATE POLICY "Org vê arquivos de documentação"
  ON public.documentation_files FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.documentation_cards c
      WHERE c.id = card_id AND public.user_belongs_to_admin(c.admin_id)
    )
  );

DROP POLICY IF EXISTS "Admin gerencia arquivos de documentação" ON public.documentation_files;
CREATE POLICY "Admin gerencia arquivos de documentação"
  ON public.documentation_files FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.documentation_cards c
      WHERE c.id = card_id AND c.admin_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.documentation_cards c
      WHERE c.id = card_id AND c.admin_id = auth.uid()
    )
  );

-- Plantões
DROP POLICY IF EXISTS "Org vê plantões" ON public.shift_schedules;
CREATE POLICY "Org vê plantões"
  ON public.shift_schedules FOR SELECT
  USING (
    public.user_belongs_to_admin(admin_id)
    AND (member_id = auth.uid() OR admin_id = auth.uid())
  );

DROP POLICY IF EXISTS "Admin gerencia plantões" ON public.shift_schedules;
CREATE POLICY "Admin gerencia plantões"
  ON public.shift_schedules FOR ALL
  USING (admin_id = auth.uid())
  WITH CHECK (admin_id = auth.uid());

-- Notificações
DROP POLICY IF EXISTS "Usuário vê suas notificações" ON public.user_notifications;
CREATE POLICY "Usuário vê suas notificações"
  ON public.user_notifications FOR SELECT
  USING (recipient_id = auth.uid());

DROP POLICY IF EXISTS "Usuário atualiza suas notificações" ON public.user_notifications;
CREATE POLICY "Usuário atualiza suas notificações"
  ON public.user_notifications FOR UPDATE
  USING (recipient_id = auth.uid());

-- ============================================================
-- 7. Storage bucket (privado)
-- ============================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'clinic-documents',
  'clinic-documents',
  false,
  10485760,
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/png',
    'image/webp',
    'text/plain'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 8. Índices
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_documentation_cards_admin ON public.documentation_cards(admin_id);
CREATE INDEX IF NOT EXISTS idx_documentation_files_card ON public.documentation_files(card_id);
CREATE INDEX IF NOT EXISTS idx_shift_schedules_admin ON public.shift_schedules(admin_id);
CREATE INDEX IF NOT EXISTS idx_shift_schedules_member ON public.shift_schedules(member_id);
CREATE INDEX IF NOT EXISTS idx_shift_schedules_date ON public.shift_schedules(shift_date);
CREATE INDEX IF NOT EXISTS idx_user_notifications_recipient ON public.user_notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_user_notifications_active ON public.user_notifications(recipient_id, dismissed_at);
