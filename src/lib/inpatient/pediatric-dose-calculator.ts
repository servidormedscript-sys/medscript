export type PediatricCalcResult = {
  id: string;
  label: string;
  result: string;
  note?: string;
};

export function calculatePediatricDoses(weightKg: number): PediatricCalcResult[] {
  if (!Number.isFinite(weightKg) || weightKg <= 0) return [];

  const w = weightKg;
  return [
    {
      id: "amoxicilina",
      label: "Amoxicilina",
      result: `${Math.round(w * 50)}mg/dia VO dividido 8/8h (50mg/kg/dia)`,
    },
    {
      id: "amoxiclav",
      label: "Amoxi-Clav",
      result: `${Math.round(w * 45)}mg amoxicilina/dia VO 12/12h`,
    },
    {
      id: "azitromicina",
      label: "Azitromicina",
      result: `${Math.round(w * 10)}mg/dia VO 24/24h (máx 500mg)`,
    },
    {
      id: "cefalexina",
      label: "Cefalexina",
      result: `${Math.round(w * 50)}mg/dia VO 6/6h`,
    },
    {
      id: "ceftriaxona",
      label: "Ceftriaxona EV",
      result: `${Math.round((w * 100) / 2)}mg 12/12h (100mg/kg/dia ÷2)`,
    },
    {
      id: "dipirona_inj",
      label: "Dipirona injetável",
      result: `${Math.round(w * 15)}mg/dose EV (15mg/kg)`,
    },
    {
      id: "paracetamol",
      label: "Paracetamol gotas",
      result: `${Math.round(w * 15)}mg/dose (15mg/kg)`,
    },
    {
      id: "ibuprofeno",
      label: "Ibuprofeno gotas",
      result: `${Math.round(w * 10)}mg/dose (10mg/kg)`,
    },
    {
      id: "prednisolona",
      label: "Prednisolona susp.",
      result: `${Math.min(20, Math.round((w / 3) * 10) / 10)}mL/dia (peso/3, máx 20mL)`,
    },
    {
      id: "ondansetrona",
      label: "Ondansetrona",
      result: `${Math.round(w * 0.15 * 10) / 10}mg/dose EV (0,15mg/kg)`,
    },
    {
      id: "bromoprida",
      label: "Bromoprida",
      result: `${Math.round(w * 0.5 * 10) / 10}mg/dose EV (0,5mg/kg)`,
    },
    {
      id: "dimenidrinato",
      label: "Dimenidrinato",
      result: `${Math.round(w * 1.25 * 10) / 10}mg/dose (1,25mg/kg)`,
    },
    {
      id: "hidrocortisona_asma",
      label: "Hidrocortisona (asma)",
      result: `${Math.round(w * 4)}mg EV (4mg/kg)`,
      note: "Crise asmática — repetir conforme resposta.",
    },
    {
      id: "hidrocortisona_alergia",
      label: "Hidrocortisona (alergia)",
      result: `${Math.round(w * 5)}mg EV (5mg/kg)`,
      note: "Reação alérgica grave — associar ao manejo do quadro.",
    },
    {
      id: "adrenalina",
      label: "Adrenalina 1:1000 (anafilaxia)",
      result: `${Math.round(w * 0.01 * 1000) / 1000}mL IM (0,01mg/kg, máx 0,5mg)`,
      note: "Anafilaxia — dose única IM face lateral da coxa.",
    },
  ];
}
