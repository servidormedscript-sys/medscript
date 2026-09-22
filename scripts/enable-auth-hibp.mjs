#!/usr/bin/env node
/**
 * Ativa password_hibp_enabled (requer plano Pro+ no Supabase).
 * No plano Free, use a política em src/lib/auth/password-policy.ts.
 */
import { readFileSync, existsSync } from "fs";
import { homedir } from "os";
import { join } from "path";

const PROJECT_REF = "katepfoxlainldspmbfk";

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
    if (existsSync(p)) {
      return readFileSync(p, "utf8").trim();
    }
  }
  return null;
}

const token = findAccessToken();
if (!token) {
  console.error("Token não encontrado. Opções:");
  console.error("  1) npx supabase login");
  console.error("  2) $env:SUPABASE_ACCESS_TOKEN = \"...\"  (Dashboard → Account → Access Tokens)");
  console.error("  3) Dashboard → Authentication → Password → Prevent use of leaked passwords");
  process.exit(1);
}

const url = `https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth`;

const getRes = await fetch(url, {
  headers: { Authorization: `Bearer ${token}` },
});
if (!getRes.ok) {
  console.error("GET auth config failed:", getRes.status, await getRes.text());
  process.exit(1);
}

const current = await getRes.json();
if (current.password_hibp_enabled === true) {
  console.log("password_hibp_enabled já está ativo.");
  process.exit(0);
}

const patchRes = await fetch(url, {
  method: "PATCH",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ password_hibp_enabled: true }),
});

if (!patchRes.ok) {
  console.error("PATCH auth config failed:", patchRes.status, await patchRes.text());
  process.exit(1);
}

const updated = await patchRes.json();
console.log(
  "password_hibp_enabled:",
  updated.password_hibp_enabled === true ? "ativado" : updated.password_hibp_enabled
);
