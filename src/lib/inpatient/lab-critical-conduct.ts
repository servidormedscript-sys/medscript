import type { EpisodeLabValue } from "@/lib/types/inpatient-chart";
import type { PrescriptionInput } from "@/lib/types/inpatient-chart";

export type CriticalLabConduct = {
  id: string;
  title: string;
  detail: string;
  source: string;
  prescriptions: PrescriptionInput[];
};

const DISCLAIMER =
  "Sugestão de conduta por regra simples — sempre revise antes de usar, não substitui julgamento clínico.";

export function criticalConductDisclaimer(): string {
  return DISCLAIMER;
}

function latestValue(
  values: EpisodeLabValue[],
  key: string,
): number | null {
  const row = values
    .filter((v) => v.analyte_key === key)
    .sort(
      (a, b) =>
        new Date(b.collected_at).getTime() - new Date(a.collected_at).getTime(),
    )[0];
  return row?.value ?? null;
}

export function computeCriticalLabConducts(
  values: EpisodeLabValue[],
): CriticalLabConduct[] {
  const out: CriticalLabConduct[] = [];
  const na = latestValue(values, "sodio");
  const k = latestValue(values, "potassio");
  const glu = latestValue(values, "glicemia");
  const lac = latestValue(values, "lactato");

  if (na != null && na >= 160) {
    out.push({
      id: "na_high",
      title: "Hipernatremia grave",
      detail:
        "Soro Glicosado 5%, corrigir devagar (máx. ~8–10 mEq/L/24h).",
      source: "Adrogué & Madias, NEJM 2000 · StatPearls 2025",
      prescriptions: [
        {
          name: "Soro Glicosado 5%",
          dose: "conforme cálculo de déficit",
          route: "EV",
          frequency: "titulada",
          indication: "Hipernatremia grave",
          use_continuous: true,
        },
      ],
    });
  }
  if (na != null && na <= 120) {
    out.push({
      id: "na_low",
      title: "Hiponatremia grave",
      detail:
        "Avaliar volemia; considerar salina hipertônica se sintomática (meta 4–6 mEq/L nas 6h iniciais).",
      source: "Spasovski 2014 · NDT 2024",
      prescriptions: [],
    });
  }
  if (k != null && k >= 6.5) {
    out.push({
      id: "k_high",
      title: "Hipercalemia grave",
      detail:
        "Gluconato de Cálcio 10% 30mL EV em 10min + Insulina Regular 10UI + Glicose 25g EV, HGT seriado.",
      source: "UK Kidney Association 2023",
      prescriptions: [
        {
          name: "Gluconato de Cálcio 10%",
          dose: "30mL",
          route: "EV",
          frequency: "em 10min — repetir se ECG não melhorar",
          indication: "Hipercalemia grave",
          use_continuous: false,
        },
        {
          name: "Insulina Regular",
          dose: "10UI",
          route: "EV",
          frequency: "dose única",
          indication: "Hipercalemia grave",
          use_continuous: false,
        },
        {
          name: "Glicose",
          dose: "25g",
          route: "EV",
          frequency: "dose única",
          indication: "Hipercalemia grave",
          use_continuous: false,
        },
      ],
    });
  }
  if (k != null && k <= 2.5) {
    out.push({
      id: "k_low",
      title: "Hipocalemia grave",
      detail:
        "Repor com cautela na velocidade; monitorização cardíaca se reposição rápida.",
      source: "UK Kidney Association 2023",
      prescriptions: [],
    });
  }
  if (glu != null && glu <= 60) {
    out.push({
      id: "glu_low",
      title: "Hipoglicemia",
      detail: "Glicose 50%, 20–40mL EV dose única; repetir HGT em 15min.",
      source: "ADA Standards of Care 2024/2026",
      prescriptions: [
        {
          name: "Glicose 50%",
          dose: "20–40mL",
          route: "EV",
          frequency: "dose única",
          indication: "Hipoglicemia",
          use_continuous: false,
        },
      ],
    });
  }
  if (lac != null && lac >= 4) {
    out.push({
      id: "lac_high",
      title: "Lactato elevado",
      detail:
        "Reavaliar perfusão/reanimação volêmica; considerar sepse/choque.",
      source: "Surviving Sepsis Campaign 2026 · ILAS 2023",
      prescriptions: [],
    });
  }

  return out;
}
