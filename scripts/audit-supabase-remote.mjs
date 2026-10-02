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

const inpatientTables = [
  "episode_vital_records",
  "episode_evolutions",
  "episode_prescriptions",
  "episode_lab_values",
  "episode_conduct",
  "episode_discharge",
  "episode_internacao",
  "episode_timeline_events",
  "episode_core_generations",
  "episode_treatment_responses",
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

  console.log("\nInternação (tabelas via API):");
  for (const t of inpatientTables) {
    const { count, error } = await admin.from(t).select("*", { head: true, count: "exact" });
    if (error) {
      console.log(`  ${t}: ERRO — ${error.message}`);
    } else {
      console.log(`  ${t}: OK (linhas ~${count ?? "?"})`);
    }
  }

  const colChecks = [
    { table: "episode_evolutions", col: "signed_at", label: "032 assinatura evolução" },
    { table: "episode_conduct", col: "no_specific_treatment", label: "033 sem tratamento específico" },
    { table: "episode_internacao", col: "finalized_at", label: "034 AIH finalizada" },
    { table: "episode_evolutions", col: "addendum_of_id", label: "035 adendo evolução" },
    { table: "episode_conduct", col: "no_treatment_response_waiver", label: "036 dispensa resposta tratamento" },
    { table: "episode_general_orders", col: "caprini_score", label: "036 Caprini TEV" },
    { table: "episode_evolutions", col: "addendum_reason", label: "037 motivo adendo" },
  ];
  console.log("\nColunas migrations 032–037:");
  for (const { table, col, label } of colChecks) {
    const { error } = await admin.from(table).select(col, { head: true, count: "exact" });
    console.log(`  ${label}: ${error ? `PENDENTE — ${error.message}` : "OK"}`);
  }

  const { count: profileCount, error: pErr } = await admin
    .from("profiles")
    .select("*", { head: true, count: "exact" });
  if (!pErr) {
    console.log("Perfis cadastrados:", profileCount);
  }

  console.log("\nCLI Supabase:");
  console.log("  npm run supabase:login");
  console.log("  npm run supabase:link");
  console.log("  npm run supabase:migrations   # listar local vs remoto");
  console.log("  npm run supabase:push         # aplicar migrations pendentes");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
