import type { VitalSigns } from "@/lib/types/clinical-assessment";
import { FINDING_LABELS } from "@/lib/clinical/t0-form-config";

export type GraveRuleResult = {
  id: string;
  title: string;
  score: number;
  reasons: string[];
  protocolId: string | null;
  categoryId: string | null;
};

export type GraveSuggestionBadge = "prioridade_alta" | "considerar" | "possivel";

export type GraveSuggestion = GraveRuleResult & {
  badge: GraveSuggestionBadge;
};

export type GraveScoringContext = {
  vital: VitalSigns;
  findings: Record<string, boolean>;
};

function num(value: string): number | null {
  const n = parseFloat(String(value).replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

function febreOuHipotermia(temp: string): boolean {
  const t = num(temp);
  if (t === null) return false;
  return t >= 38 || t < 36;
}

function add(label: string, pts: number, bucket: Bucket) {
  bucket.score += pts;
  bucket.reasons.push(`${label} (+${pts})`);
}

type Bucket = { score: number; reasons: string[] };

function ruleSepse(ctx: GraveScoringContext): GraveRuleResult {
  const b: Bucket = { score: 0, reasons: [] };
  const { vital, findings } = ctx;
  const fc = num(vital.heart_rate);
  const fr = num(vital.respiratory_rate);
  const pas = num(vital.systolic_bp);

  if (findings.confusao_mental) add("Confusão mental", 2, b);
  if (vital.tec === "gt_6s") add("TEC >6s", 2, b);
  else if (vital.tec === "3_6s") add("TEC 3–6s", 1, b);
  if (febreOuHipotermia(vital.temperature)) add("Febre ≥38°C ou hipotermia <36°C", 2, b);
  if (pas !== null && pas < 90) add("PAS <90", 2, b);
  if (fr !== null && fr > 22) add("FR >22", 1, b);
  if (findings.dispneia) add("Dispneia", 1, b);

  return {
    id: "sepse",
    title: "Sepse / choque séptico",
    score: b.score,
    reasons: b.reasons,
    protocolId: "sepse-choque",
    categoryId: "emergencia",
  };
}

function ruleTaqui(ctx: GraveScoringContext): GraveRuleResult {
  const b: Bucket = { score: 0, reasons: [] };
  const fc = num(ctx.vital.heart_rate);
  let anchor = false;
  if (fc !== null && fc > 180) {
    add("FC >180", 4, b);
    anchor = true;
  } else if (fc !== null && fc > 150) {
    add("FC >150", 3, b);
    anchor = true;
  }
  if (anchor) {
    const pas = num(ctx.vital.systolic_bp);
    if (pas !== null && pas < 90) add("PAS <90 associada", 2, b);
    if (ctx.findings.dor_toracica) add("Dor torácica associada", 1, b);
    if (ctx.findings.confusao_mental) add("Confusão associada", 1, b);
  }
  return {
    id: "taquiarritmia",
    title: "Taquiarritmia",
    score: b.score,
    reasons: b.reasons,
    protocolId: "taquiarritmias",
    categoryId: "cardiologia",
  };
}

function ruleBrady(ctx: GraveScoringContext): GraveRuleResult {
  const b: Bucket = { score: 0, reasons: [] };
  const fc = num(ctx.vital.heart_rate);
  let anchor = false;
  if (fc !== null && fc < 50) {
    add("FC <50", 3, b);
    anchor = true;
  }
  if (anchor) {
    if (ctx.findings.sincope) add("Síncope/pré-síncope", 2, b);
    const pas = num(ctx.vital.systolic_bp);
    if (pas !== null && pas < 90) add("PAS <90 associada", 2, b);
    if (ctx.findings.confusao_mental) add("Confusão associada", 1, b);
  }
  return {
    id: "bradiarritmia",
    title: "Bradiarritmia",
    score: b.score,
    reasons: b.reasons,
    protocolId: "bradiarritmias",
    categoryId: "cardiologia",
  };
}

function ruleAvc(ctx: GraveScoringContext): GraveRuleResult {
  const b: Bucket = { score: 0, reasons: [] };
  let anchor = false;
  if (ctx.findings.deficit_neurologico) {
    add("Déficit focal agudo", 4, b);
    anchor = true;
  }
  if (ctx.findings.cefaleia_subita) {
    add("Cefaleia thunderclap", 3, b);
    anchor = true;
  }
  if (ctx.findings.alteracao_pupilar) {
    add("Anisocoria", 2, b);
    anchor = true;
  }
  if (anchor && ctx.findings.confusao_mental) add("Confusão associada", 1, b);
  return {
    id: "avc",
    title: "AVC / HSA",
    score: b.score,
    reasons: b.reasons,
    protocolId: "avc",
    categoryId: "clinica-aguda",
  };
}

function ruleMeningite(ctx: GraveScoringContext): GraveRuleResult {
  const b: Bucket = { score: 0, reasons: [] };
  let anchor = false;
  if (ctx.findings.rigidez_nuca) {
    add("Rigidez de nuca", 3, b);
    anchor = true;
  }
  if (anchor) {
    if (febreOuHipotermia(ctx.vital.temperature)) add("Febre associada", 2, b);
    if (ctx.findings.confusao_mental) add("Confusão associada", 1, b);
  }
  return {
    id: "meningite",
    title: "Meningite / encefalite",
    score: b.score,
    reasons: b.reasons,
    protocolId: "meningite",
    categoryId: "clinica-aguda",
  };
}

function ruleTep(ctx: GraveScoringContext): GraveRuleResult {
  const b: Bucket = { score: 0, reasons: [] };
  let anchor = false;
  if (ctx.findings.dor_panturrilha) {
    add("Assimetria/dor panturrilha", 3, b);
    anchor = true;
  }
  if (ctx.findings.dispneia) {
    add("Dispneia", 2, b);
    anchor = true;
  }
  if (anchor) {
    if (ctx.findings.dor_toracica) add("Dor torácica associada", 1, b);
    const fc = num(ctx.vital.heart_rate);
    if (fc !== null && fc > 100) add("Taquicardia associada", 1, b);
  }
  return {
    id: "tep",
    title: "Tromboembolismo pulmonar",
    score: b.score,
    reasons: b.reasons,
    protocolId: "tep",
    categoryId: "clinica-aguda",
  };
}

function ruleAbdome(ctx: GraveScoringContext): GraveRuleResult {
  const b: Bucket = { score: 0, reasons: [] };
  const defesa = ctx.findings.defesa_abdominal;
  const dor = ctx.findings.dor_abdominal;
  if (defesa) add("Defesa abdominal", 3, b);
  if (dor) add("Dor abdominal", 2, b);
  if (ctx.findings.ictericia) add("Icterícia", 2, b);
  if (ctx.findings.distensao_abdominal) add("Distensão", 1, b);
  if ((defesa || dor) && febreOuHipotermia(ctx.vital.temperature)) add("Febre associada", 1, b);
  return {
    id: "abdome_agudo",
    title: "Abdome agudo",
    score: b.score,
    reasons: b.reasons,
    protocolId: "abdome-agudo",
    categoryId: "clinica-aguda",
  };
}

function ruleIc(ctx: GraveScoringContext): GraveRuleResult {
  const b: Bucket = { score: 0, reasons: [] };
  let anchor = false;
  if (ctx.findings.edema_mmii) {
    add("Edema MMII", 2, b);
    anchor = true;
  }
  if (ctx.findings.dispneia) {
    add("Dispneia", 2, b);
    anchor = true;
  }
  if (anchor) {
    const spo2 = num(ctx.vital.spo2);
    if (spo2 !== null && spo2 < 94) add("SpO₂ <94% associada", 1, b);
  }
  return {
    id: "ic_descompensada",
    title: "IC descompensada / congestão",
    score: b.score,
    reasons: b.reasons,
    protocolId: "ic-aguda-descompensada",
    categoryId: "cardiologia",
  };
}

function ruleIsquemiaArterial(ctx: GraveScoringContext): GraveRuleResult {
  const b: Bucket = { score: 0, reasons: [] };
  if (ctx.findings.pulso_diminuido) add("Pulso ausente/diminuído + membro frio", 4, b);
  return {
    id: "isquemia_arterial",
    title: "Isquemia arterial aguda de membro",
    score: b.score,
    reasons: b.reasons,
    protocolId: "isquemia-arterial-membro",
    categoryId: "emergencia",
  };
}

function ruleAnafilaxia(ctx: GraveScoringContext): GraveRuleResult {
  const b: Bucket = { score: 0, reasons: [] };
  let anchor = false;
  if (ctx.findings.anafilaxia) {
    add("Urticária/alérgeno", 3, b);
    anchor = true;
  }
  if (anchor) {
    const pas = num(ctx.vital.systolic_bp);
    if (ctx.findings.dispneia || (pas !== null && pas < 90))
      add("Dispneia ou PAS <90", 2, b);
    if (ctx.findings.sibilos) add("Sibilos associados", 1, b);
  }
  return {
    id: "anafilaxia",
    title: "Anafilaxia",
    score: b.score,
    reasons: b.reasons,
    protocolId: "anafilaxia",
    categoryId: "emergencia",
  };
}

function ruleChoque(ctx: GraveScoringContext): GraveRuleResult {
  const b: Bucket = { score: 0, reasons: [] };
  let anchor = false;
  if (ctx.findings.trauma_recente) {
    add("Trauma", 2, b);
    anchor = true;
  }
  if (ctx.findings.sangramento_ativo) {
    add("Sangramento", 2, b);
    anchor = true;
  }
  if (anchor) {
    const pas = num(ctx.vital.systolic_bp);
    if (pas !== null && pas < 90) add("PAS <90", 2, b);
    if (ctx.vital.tec === "gt_6s") add("TEC >6s", 2, b);
    const fc = num(ctx.vital.heart_rate);
    if (fc !== null && fc > 100) add("FC >100", 1, b);
  }
  return {
    id: "choque",
    title: "Choque hipovolêmico/hemorrágico",
    score: b.score,
    reasons: b.reasons,
    protocolId: "choque-hemorragico",
    categoryId: "emergencia",
  };
}

function ruleCeto(ctx: GraveScoringContext): GraveRuleResult {
  const b: Bucket = { score: 0, reasons: [] };
  const glic = num(ctx.vital.blood_glucose);
  let anchor = false;
  if (glic !== null && glic >= 250) {
    add("Glicemia ≥250", 3, b);
    anchor = true;
  }
  if (anchor) {
    const fr = num(ctx.vital.respiratory_rate);
    if (fr !== null && fr > 22) add("FR >22 (Kussmaul)", 1, b);
    if (ctx.findings.confusao_mental) add("Confusão associada", 1, b);
  }
  return {
    id: "cetoacidose",
    title: "Cetoacidose diabética",
    score: b.score,
    reasons: b.reasons,
    protocolId: "cad",
    categoryId: "clinica-aguda",
  };
}

function ruleAsma(ctx: GraveScoringContext): GraveRuleResult {
  const b: Bucket = { score: 0, reasons: [] };
  let anchor = false;
  if (ctx.findings.sibilos) {
    add("Sibilos", 3, b);
    anchor = true;
  }
  if (anchor) {
    if (ctx.findings.dispneia) add("Dispneia", 2, b);
    const spo2 = num(ctx.vital.spo2);
    if (spo2 !== null && spo2 < 94) add("SpO₂ <94%", 1, b);
  }
  return {
    id: "asma",
    title: "Crise de broncoespasmo",
    score: b.score,
    reasons: b.reasons,
    protocolId: "asma",
    categoryId: "clinica-aguda",
  };
}

function ruleConvulsao(ctx: GraveScoringContext): GraveRuleResult {
  const b: Bucket = { score: 0, reasons: [] };
  let anchor = false;
  if (ctx.findings.convulsao) {
    add("Convulsão", 3, b);
    anchor = true;
  }
  if (anchor) {
    if (ctx.findings.confusao_mental) add("Confusão pós-ictal", 1, b);
    const glic = num(ctx.vital.blood_glucose);
    if (glic !== null && glic < 70) add("Hipoglicemia associada", 1, b);
  }
  return {
    id: "convulsao",
    title: "Crise convulsiva",
    score: b.score,
    reasons: b.reasons,
    protocolId: "crise-convulsiva",
    categoryId: "clinica-aguda",
  };
}

function ruleRebaix(ctx: GraveScoringContext): GraveRuleResult {
  const b: Bucket = { score: 0, reasons: [] };
  let anchor = false;
  if (ctx.findings.confusao_mental) {
    add("Confusão mental", 2, b);
    anchor = true;
  }
  if (anchor) {
    const glic = num(ctx.vital.blood_glucose);
    if (glic !== null && glic < 70) add("Hipoglicemia associada", 2, b);
    if (ctx.findings.alteracao_pupilar) add("Anisocoria associada", 1, b);
  }
  return {
    id: "rebaixamento",
    title: "Rebaixamento de consciência",
    score: b.score,
    reasons: b.reasons,
    protocolId: "rebaixamento-consciencia",
    categoryId: "clinica-aguda",
  };
}

function ruleTrauma(ctx: GraveScoringContext): GraveRuleResult {
  const b: Bucket = { score: 0, reasons: [] };
  let anchor = false;
  if (ctx.findings.trauma_recente) {
    add("Trauma recente", 3, b);
    anchor = true;
  }
  if (anchor && ctx.findings.sangramento_ativo) add("Sangramento associado", 1, b);
  return {
    id: "trauma",
    title: "Trauma",
    score: b.score,
    reasons: b.reasons,
    protocolId: "trauma-grave",
    categoryId: "emergencia",
  };
}

const RULE_FNS = [
  ruleSepse,
  ruleTaqui,
  ruleBrady,
  ruleAvc,
  ruleMeningite,
  ruleTep,
  ruleAbdome,
  ruleIc,
  ruleIsquemiaArterial,
  ruleAnafilaxia,
  ruleChoque,
  ruleCeto,
  ruleAsma,
  ruleConvulsao,
  ruleRebaix,
  ruleTrauma,
];

export function badgeForScore(score: number): GraveSuggestionBadge {
  if (score >= 5) return "prioridade_alta";
  if (score >= 3) return "considerar";
  return "possivel";
}

export function scorePatientGrave(ctx: GraveScoringContext): {
  pcr: boolean;
  suggestions: GraveSuggestion[];
  hasAnyInput: boolean;
} {
  if (ctx.findings.parada_respiratoria) {
    return {
      pcr: true,
      suggestions: [
        {
          id: "pcr",
          title: "Parada cardiorrespiratória",
          score: 999,
          reasons: ["Sem respiração/pulso — RCP imediata"],
          badge: "prioridade_alta",
          protocolId: "pcr-adulto",
          categoryId: "emergencia",
        },
      ],
      hasAnyInput: true,
    };
  }

  const hasAnyInput =
    Object.values(ctx.findings).some(Boolean) ||
    Object.values(ctx.vital).some((v) => String(v).trim() !== "");

  const scored = RULE_FNS.map((fn) => fn(ctx))
    .filter((r) => r.score >= 2)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map((r) => ({ ...r, badge: badgeForScore(r.score) }));

  return { pcr: false, suggestions: scored, hasAnyInput };
}

export type BaselineSnapshot = {
  savedAt: string;
  vital: VitalSigns;
  findings: Record<string, boolean>;
  topId: string | null;
  topScore: number;
};

export function compareEvolution(
  baseline: BaselineSnapshot,
  current: GraveScoringContext,
  currentTop: GraveSuggestion | undefined
): string[] {
  const lines: string[] = [];
  const vitals: (keyof VitalSigns)[] = [
    "temperature",
    "heart_rate",
    "respiratory_rate",
    "systolic_bp",
    "spo2",
  ];
  const labels: Record<string, string> = {
    temperature: "Temp",
    heart_rate: "FC",
    respiratory_rate: "FR",
    systolic_bp: "PAS",
    spo2: "SpO₂",
  };

  for (const key of vitals) {
    const before = baseline.vital[key];
    const after = current.vital[key];
    if (!before && !after) continue;
    if (before === after) continue;
    let trend = "";
    const bN = num(String(before));
    const aN = num(String(after));
    if (bN !== null && aN !== null) {
      if (key === "heart_rate" || key === "respiratory_rate") {
        trend = aN > bN ? " ↑ pior" : aN < bN ? " ↓" : "";
      } else if (key === "systolic_bp" || key === "spo2") {
        trend = aN < bN ? " ↓ pior" : aN > bN ? " ↑" : "";
      }
    }
    lines.push(`${labels[key]}: ${before || "—"} → ${after || "—"}${trend}`);
  }

  for (const [k, v] of Object.entries(current.findings)) {
    if (v && !baseline.findings[k])
      lines.push(`Novo achado: ${FINDING_LABELS[k] ?? k}`);
  }
  for (const [k, v] of Object.entries(baseline.findings)) {
    if (v && !current.findings[k])
      lines.push(`Resolvido: ${FINDING_LABELS[k] ?? k}`);
  }

  const sameTop = baseline.topId && currentTop?.id === baseline.topId;
  const scoreUp = (currentTop?.score ?? 0) > baseline.topScore;
  const scoreDown = (currentTop?.score ?? 0) < baseline.topScore;
  const newFindings = Object.entries(current.findings).some(([k, v]) => v && !baseline.findings[k]);
  const vitalWorse = lines.some((l) => l.includes("pior"));

  if (sameTop && scoreUp) lines.push("Veredito: suspeita principal piorou (pontuação subiu).");
  else if (sameTop && scoreDown && !newFindings && !vitalWorse)
    lines.push("Veredito: provável melhora (pontuação caiu, sem novos achados).");
  else if (sameTop && scoreDown && (newFindings || vitalWorse))
    lines.push("Veredito: pontuação caiu, mas há achado/sinal em piora — não assumir melhora.");
  else if (sameTop && !scoreUp && !scoreDown && (newFindings || vitalWorse))
    lines.push("Veredito: estável na pontuação, com achado(s) em piora.");
  else if (baseline.topId && currentTop && baseline.topId !== currentTop.id)
    lines.push("Veredito: suspeita principal mudou desde T0.");

  return lines;
}
