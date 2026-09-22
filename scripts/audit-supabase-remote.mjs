/**
 * Auditoria read-only do projeto Supabase remoto (usa .env.local).
 * Uso: node scripts/audit-supabase-remote.mjs
 */
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const envPath = resolve(root, ".env.local");

function loadEnv() {
  if (!existsSync(envPath)) {
    console.error("Arquivo .env.local não encontrado.");
    process.exit(1);
  }
  const env = {};
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i === -1) continue;
    env[t.slice(0, i).trim()] = t.slice(i + 1).trim().replace(/^["']|["']$/g, "");
  }
  return env;
}

const env = loadEnv();
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
const expectedRef = "katepfoxlainldspmbfk";

if (!url || !serviceKey) {
  console.error("Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY em .env.local");
  process.exit(1);
}

const refMatch = url.match(/https:\/\/([^.]+)\.supabase\.co/);
const ref = refMatch?.[1] ?? "?";
console.log("Projeto URL:", url);
console.log("Project ref:", ref, ref === expectedRef ? "(MedScript OK)" : `(esperado ${expectedRef})`);
console.log("---");

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const medscriptTables = [
  "profiles",
  "subscriptions",
  "patients",
  "patient_episodes",
  "documentation_cards",
  "shift_schedules",
  "notifications",
  "support_tickets",
];

async function main() {
  console.log("Tabelas MedScript (existência via API):");
  for (const t of medscriptTables) {
    const { count, error } = await admin.from(t).select("*", { head: true, count: "exact" });
    if (error) {
      console.log(`  ${t}: ERRO — ${error.message}`);
    } else {
      console.log(`  ${t}: OK (linhas ~${count ?? "?"})`);
    }
  }

  const { error: graveColErr } = await admin
    .from("patient_episodes")
    .select("grave_baseline", { head: true, count: "exact" });
  if (graveColErr) {
    console.log("\nMigration 017 (grave_baseline): PENDENTE —", graveColErr.message);
  } else {
    console.log("\nMigration 017 (grave_baseline): coluna presente");
  }

  const { count: profileCount, error: pErr } = await admin
    .from("profiles")
    .select("*", { head: true, count: "exact" });
  if (!pErr) {
    console.log("Perfis cadastrados:", profileCount);
  }

  console.log("\nCLI (PowerShell interativo — eu não consigo abrir o login daqui):");
  console.log("  npx supabase login");
  console.log("  npm run supabase:link");
  console.log("  npm run supabase:migrations");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
