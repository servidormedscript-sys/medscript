export type DischargeSuggestion = {
  id: string;
  label: string;
  pattern: RegExp;
  source: string;
  block: string;
};

export const DISCHARGE_SUGGESTIONS: DischargeSuggestion[] = [
  {
    id: "icc",
    label: "ICC",
    pattern: /\b(icc|insufici[eê]ncia card[ií]aca)\b/i,
    source: "Diretriz SBC IC 2023",
    block: `Encaminhamento: Cardiologia em 7–14 dias.
Exames de controle: função renal, eletrólitos, BNP se disponível.
Orientações: dieta hipossódica, controle hídrico, peso diário.
Sinais de alarme: dispneia progressiva, edema rápido, ganho >2 kg/dia.`,
  },
  {
    id: "iam_sca",
    label: "IAM / SCA",
    pattern: /\b(iam|sca|infarto|s[ií]ndrome coronariana)\b/i,
    source: "ESC 2023 · SBC 2025",
    block: `Encaminhamento: Cardiologia em 7 dias (reabilitação se indicada).
Exames: lipidograma, função renal, ECG de controle conforme caso.
Orientações: dupla antiagregação conforme prescrição, não interromper sem orientação.
Sinais de alarme: dor torácica, síncope, dispneia súbita.`,
  },
  {
    id: "avc",
    label: "AVC",
    pattern: /\b(avc|ave|acidente vascular)\b/i,
    source: "AHA/ASA 2019",
    block: `Encaminhamento: Neurologia / ambulatório AVC em 30 dias.
Exames: conforme etiologia investigada na internação.
Orientações: fisioterapia/fonoaudiologia se prescritas; controle de PA.
Sinais de alarme: piora neurológica súbita, convulsão, cefaleia intensa.`,
  },
  {
    id: "dpoc",
    label: "DPOC",
    pattern: /\b(dpoc|enfisema|bronquite cr[oô]nica)\b/i,
    source: "GOLD 2024",
    block: `Encaminhamento: Pneumologia em 30–60 dias.
Exames: espirometria ambulatorial se não realizada.
Orientações: cessar tabagismo; uso correto de broncodilatadores.
Sinais de alarme: dispneia em repouso, cianose, confusão.`,
  },
  {
    id: "pac",
    label: "PAC",
    pattern: /\b(pac|pneumonia adquirida na comunidade)\b/i,
    source: "ATS/IDSA 2019",
    block: `Encaminhamento: Clínica médica / pneumologia se comorbidades.
Exames: radiografia de controle se indicada clinicamente.
Orientações: completar antibiótico; hidratação; repouso relativo.
Sinais de alarme: febre persistente, dispneia, queda da SatO₂.`,
  },
  {
    id: "dm_descomp",
    label: "Diabetes descompensado",
    pattern: /\b(dm descompensad|hiperglicemia|cetoacidose|cad)\b/i,
    source: "ADA 2024",
    block: `Encaminhamento: Endocrinologia em 14–30 dias.
Exames: HbA1c, função renal, perfil lipídico.
Orientações: esquema de insulina/orais conforme prescrição; monitorar glicemia capilar.
Sinais de alarme: vômitos, hálito cetônico, sonolência, desidratação.`,
  },
  {
    id: "itu",
    label: "ITU / Pielonefrite",
    pattern: /\b(itu|pielonefrite|infec[cç][aã]o urin[aá]ria)\b/i,
    source: "IDSA 2011",
    block: `Encaminhamento: Clínica médica / urologia se recorrente.
Exames: urocultura de controle se indicada.
Orientações: completar antibiótico; hidratação.
Sinais de alarme: febre, dor lombar, oligúria.`,
  },
  {
    id: "tep",
    label: "TEP",
    pattern: /\b(tep|embolia pulmonar|tromboembolismo)\b/i,
    source: "ESC 2019",
    block: `Encaminhamento: Hematologia / pneumologia em 30 dias.
Exames: função renal para ajuste de anticoagulante.
Orientações: anticoagulação conforme prescrição; evitar AINEs sem orientação.
Sinais de alarme: dispneia súbita, hemoptise, dor torácica pleurítica.`,
  },
  {
    id: "sepse",
    label: "Sepse",
    pattern: /\b(sepse|choque s[eé]ptico)\b/i,
    source: "Surviving Sepsis 2021",
    block: `Encaminhamento: Clínica médica em 7–14 dias.
Exames: hemograma, função renal, lactato se persistência de sintomas.
Orientações: completar antibiótico; sinais de foco infeccioso residual.
Sinais de alarme: febre, hipotensão, taquipneia, confusão.`,
  },
  {
    id: "drc_lra",
    label: "DRC / LRA",
    pattern: /\b(drc|lra|ira|insufici[eê]ncia renal)\b/i,
    source: "KDIGO 2024",
    block: `Encaminhamento: Nefrologia em 7–14 dias.
Exames: creatinina, eletrólitos, urina 1.
Orientações: hidratação conforme orientação; evitar nefrotóxicos.
Sinais de alarme: oligúria, edema pulmonar, hipercalemia (fraqueza, arritmia).`,
  },
  {
    id: "hda",
    label: "HDA",
    pattern: /\b(hda|hemorragia digestiva alta|melena|hemat[eê]mese)\b/i,
    source: "ACG 2021",
    block: `Encaminhamento: Gastroenterologia em 7–14 dias; endoscopia ambulatorial se indicada.
Exames: hemograma de controle.
Orientações: evitar AINEs/álcool; IBP conforme prescrição.
Sinais de alarme: vômitos com sangue, melena, síncope.`,
  },
  {
    id: "abstinencia",
    label: "Abstinência alcoólica",
    pattern: /\b(abstin[eê]ncia|delirium tremens|etilismo)\b/i,
    source: "ASAM 2020",
    block: `Encaminhamento: Psiquiatria / CAPS em 7 dias.
Orientações: suporte familiar; evitar álcool; seguir benzodiazepínico se prescrito.
Sinais de alarmar: agitação, alucinações, convulsão.`,
  },
  {
    id: "pancreatite",
    label: "Pancreatite",
    pattern: /\b(pancreatite)\b/i,
    source: "ACG 2024",
    block: `Encaminhamento: Gastroenterologia em 14–30 dias.
Exames: lipase/amilase se sintomas; imagem se indicada.
Orientações: dieta progressiva conforme tolerância; evitar álcool.
Sinais de alarme: dor abdominal intensa, vômitos persistentes, febre.`,
  },
  {
    id: "colecistite",
    label: "Colecistite / Colangite",
    pattern: /\b(colecistite|colangite|coledocol[ií]tase)\b/i,
    source: "Tokyo Guidelines 2018",
    block: `Encaminhamento: Cirurgia / gastro em 7–14 dias para colecistectomia eletiva se indicada.
Exames: bilirrubinas, transaminases, USG se necessário.
Sinais de alarme: febre, icterícia, dor em HCD.`,
  },
  {
    id: "encefalopatia",
    label: "Encefalopatia hepática",
    pattern: /\b(encefalopatia hep[aá]tica|cirrose descompensad)\b/i,
    source: "EASL 2023",
    block: `Encaminhamento: Hepatologia em 7–14 dias.
Orientações: lactulose/rifaximina conforme prescrição; restrição de sódio se orientada.
Sinais de alarme: sonolência, confusão, icterícia, ascite tensa.`,
  },
  {
    id: "neutropenia",
    label: "Neutropenia febril",
    pattern: /\b(neutropenia febril|neutrop[eê]nic)\b/i,
    source: "IDSA 2010",
    block: `Encaminhamento: Oncologia/hematologia conforme protocolo.
Orientações: retorno imediato se febre ≥37,8°C; higiene das mãos.
Sinais de alarme: febre, calafrios, hipotensão.`,
  },
  {
    id: "asma",
    label: "Crise asmática",
    pattern: /\b(crise asm[aá]tica|asma aguda|broncoespasmo)\b/i,
    source: "GINA 2024",
    block: `Encaminhamento: Pneumologia / alergologia em 30 dias.
Orientações: corticoide inalatório de manutenção se prescrito; plano de ação para crise.
Sinais de alarme: dispneia em repouso, uso de musculatura acessória, queda da SatO₂.`,
  },
];

export function matchDischargeSuggestions(diagnosis: string | null | undefined) {
  const text = diagnosis?.trim() ?? "";
  if (!text) return [];
  return DISCHARGE_SUGGESTIONS.filter((s) => s.pattern.test(text));
}
