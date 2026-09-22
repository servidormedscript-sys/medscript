#!/usr/bin/env node
/**
 * Aplica templates de e-mail Auth no projeto Supabase (Management API).
 * Uso: npx supabase login  OU  $env:SUPABASE_ACCESS_TOKEN="..."
 *      npm run supabase:email-templates
 */
import { readFileSync, existsSync } from "fs";
import { homedir } from "os";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const PROJECT_REF = "katepfoxlainldspmbfk";
const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

function findAccessToken() {
  const candidates = [
    join(homedir(), ".supabase", "access-token"),
    join(process.env.APPDATA || "", "supabase", "access-token"),
    join(process.env.LOCALAPPDATA || "", "supabase", "access-token"),
  ];
  if (process.env.SUPABASE_ACCESS_TOKEN) {
    return process.env.SUPABASE_ACCESS_TOKEN.trim();
  }
  for (const p of candidates) {
    if (existsSync(p)) return readFileSync(p, "utf8").trim();
  }
  return null;
}

function readTemplate(name) {
  const path = join(root, "supabase", "templates", name);
  return readFileSync(path, "utf8");
}

const token = findAccessToken();
if (!token) {
  console.error("Token não encontrado. Rode npx supabase login ou defina SUPABASE_ACCESS_TOKEN.");
  console.error("Alternativa: Dashboard → Authentication → Email Templates → cole o HTML dos arquivos em supabase/templates/");
  process.exit(1);
}

const recoveryHtml = readTemplate("auth-recovery.html");
const confirmationHtml = readTemplate("auth-confirmation.html");

const payload = {
  mailer_subjects_recovery: "Redefinição de senha — MEDScript",
  mailer_templates_recovery_content: recoveryHtml,
  mailer_subjects_confirmation: "Confirme seu e-mail — MEDScript",
  mailer_templates_confirmation_content: confirmationHtml,
};

const url = `https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth`;

const res = await fetch(url, {
  method: "PATCH",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify(payload),
});

if (!res.ok) {
  console.error("Falha ao aplicar templates:", res.status, await res.text());
  process.exit(1);
}

console.log("Templates aplicados no projeto", PROJECT_REF);
console.log("  • Recuperação de senha: Redefinição de senha — MEDScript");
console.log("  • Confirmação de e-mail: Confirme seu e-mail — MEDScript");
console.log("Teste: /recuperar-senha ou novo cadastro com confirmação ativa.");
