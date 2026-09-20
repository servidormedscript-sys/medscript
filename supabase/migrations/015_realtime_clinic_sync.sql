-- Habilita Supabase Realtime para sincronização entre usuários da clínica

DO $$
DECLARE
  tbl TEXT;
  tables TEXT[] := ARRAY[
    'patients',
    'patient_episodes',
    'patient_movements',
    'patient_care_items',
    'patient_medication_doses',
    'clinical_assessments',
    'documentation_cards',
    'documentation_files',
    'shift_schedules',
    'organizations',
    'organization_members',
    'profiles',
    'user_notifications'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables
  LOOP
    IF NOT EXISTS (
      SELECT 1
      FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = tbl
    ) THEN
      EXECUTE format(
        'ALTER PUBLICATION supabase_realtime ADD TABLE public.%I',
        tbl
      );
    END IF;
  END LOOP;
END $$;
