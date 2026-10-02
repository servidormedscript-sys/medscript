/**
 * Aplica migrations no remoto com senha do Postgres (evita erro 403 do login-role).
 * Requer em .env.local: SUPABASE_DB_PASSWORD (Settings → Database no Supabase).
 * Opcional: SUPABASE_ACCESS_TOKEN, SUPABASE_DB_URL (connection string completa).
 */
import { spawnSync } from "child_process";
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { envLocalPath, loadEnvLocal } from "./load-env-local.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const PROJECT_REF = "katepfoxlainldspmbfk";

const local = loadEnvLocal();
const dbPassword = process.env.SUPABASE_DB_PASSWORD ?? local.SUPABASE_DB_PASSWORD;
const accessToken =
  process.env.SUPABASE_ACCESS_TOKEN ?? local.SUPABASE_ACCESS_TOKEN;
const explicitDbUrl =
  process.env.SUPABASE_DB_URL ?? local.SUPABASE_DB_URL ?? "";

if (!dbPassword && !explicitDbUrl) {
  console.error(
    "Defina SUPABASE_DB_PASSWORD em .env.local (senha do banco em Settings → Database).",
  );
  console.error(`Arquivo esperado: ${envLocalPath()}`);
  process.exit(1);
}

const env = { ...process.env };
if (dbPassword) env.SUPABASE_DB_PASSWORD = dbPassword;
if (accessToken) env.SUPABASE_ACCESS_TOKEN = accessToken;

function run(cmd, args, { allowFail = false } = {}) {
  const r = spawnSync(cmd, args, {
    cwd: root,
    env,
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  if (r.status !== 0 && !allowFail) {
    process.exit(r.status ?? 1);
  }
  return r.status === 0;
}

function buildPoolerDbUrl() {
  const poolerPath = resolve(root, "supabase", ".temp", "pooler-url");
  let base =
    explicitDbUrl ||
    (existsSync(poolerPath)
      ? readFileSync(poolerPath, "utf8").trim()
      : `postgresql://postgres.${PROJECT_REF}@aws-0-sa-east-1.pooler.supabase.com:5432/postgres`);

  if (explicitDbUrl) return base;

  const encoded = encodeURIComponent(dbPassword);
  if (base.includes("@")) {
    const schemeSep = base.indexOf("://");
    const at = base.indexOf("@", schemeSep + 3);
    const prefix = base.slice(0, schemeSep + 3);
    const userPart = base.slice(schemeSep + 3, at);
    const suffix = base.slice(at);
    if (!userPart.includes(":")) {
      return `${prefix}${userPart}:${encoded}${suffix}`;
    }
  }
  return base;
}

function buildDirectDbUrl() {
  const encoded = encodeURIComponent(dbPassword);
  return `postgresql://postgres:${encoded}@db.${PROJECT_REF}.supabase.co:5432/postgres`;
}

console.log("Tentando db push com senha do postgres (linked)...");
if (run("npx", ["supabase", "db", "push", "--linked", "--yes"], { allowFail: true })) {
  console.log("Concluído.");
  process.exit(0);
}

const poolerUrl = buildPoolerDbUrl();
console.log("Tentando db push via pooler (sem API login-role)...");
if (
  run(
    "npx",
    ["supabase", "db", "push", "--db-url", poolerUrl, "--yes"],
    { allowFail: true },
  )
) {
  console.log("Concluído.");
  process.exit(0);
}

console.log("Tentando conexão direta ao host db.*.supabase.co...");
run("npx", [
  "supabase",
  "db",
  "push",
  "--db-url",
  buildDirectDbUrl(),
  "--yes",
]);

console.log("Concluído.");
