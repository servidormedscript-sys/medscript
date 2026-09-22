-- RLS overview
SELECT c.relname AS table_name,
       c.relrowsecurity AS rls_on,
       (SELECT count(*) FROM pg_policies p WHERE p.schemaname = 'public' AND p.tablename = c.relname) AS policies
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relkind = 'r'
ORDER BY c.relname;

-- Tables without RLS
SELECT c.relname AS table_without_rls
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relkind = 'r' AND c.relrowsecurity = false;

-- Migration history (CLI) — skip if schema was applied via SQL Editor only
-- SELECT version, name FROM supabase_migrations.schema_migrations ORDER BY version;

-- Storage buckets
SELECT id, name, public FROM storage.buckets ORDER BY id;
