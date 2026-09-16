export type FormSection = {
  id: string;
  title: string;
  items: { id: string; label: string }[];
};

export const EXAM_SECTIONS: FormSection[] = [
  {
    id: "consciencia",
    title: "Consciência & perfusão",
    items: [
      { id: "confusao_mental", label: "Confusão mental / rebaixamento do nível de consciência" },
      { id: "sincope", label: "Síncope ou pré-síncope" },
      { id: "convulsao", label: "Convulsão" },
      { id: "deficit_neurologico", label: "Déficit neurológico focal (fala/força) de início agudo" },
      { id: "rigidez_nuca", label: "Rigidez de nuca / sinais meníngeos" },
      { id: "cefaleia_subita", label: 'Cefaleia súbita e intensa ("a pior da vida")' },
      { id: "alteracao_pupilar", label: "Alteração pupilar / anisocoria" },
    ],
  },
  {
    id: "abdome",
    title: "Abdome",
    items: [
      { id: "dor_abdominal", label: "Dor abdominal significativa" },
      { id: "defesa_abdominal", label: "Defesa/rigidez involuntária (abdome em tábua)" },
      { id: "distensao_abdominal", label: "Distensão abdominal importante" },
      { id: "ictericia", label: "Icterícia (pele/mucosas amareladas)" },
    ],
  },
  {
    id: "membros",
    title: "Membros",
    items: [
      { id: "edema_mmii", label: "Edema de membros inferiores (uni ou bilateral)" },
      { id: "dor_panturrilha", label: "Dor/assimetria unilateral de panturrilha" },
      { id: "pulso_diminuido", label: "Pulso periférico diminuído/ausente + membro frio" },
      { id: "infeccao_membro", label: "Rubor/calor/dor localizada (sinais de infecção)" },
    ],
  },
  {
    id: "respiratorio",
    title: "Respiratório / circulatório",
    items: [
      { id: "dispneia", label: "Dispneia / desconforto respiratório" },
      { id: "sibilos", label: "Sibilos / broncoespasmo audível" },
      { id: "dor_toracica", label: "Dor torácica" },
      { id: "parada_respiratoria", label: "Irresponsivo, sem respiração normal / sem pulso" },
    ],
  },
  {
    id: "pele_trauma",
    title: "Pele, exposição e trauma",
    items: [
      { id: "anafilaxia", label: "Urticária, edema de lábios/língua ou exposição a alérgeno provável" },
      { id: "trauma_recente", label: "História de trauma recente" },
      { id: "sangramento_ativo", label: "Sangramento ativo / suspeita de hemorragia" },
    ],
  },
];

export const COMPLEMENTARY_SECTIONS: FormSection[] = [
  {
    id: "geral",
    title: "Geral / Constitucional",
    items: [
      { id: "febre_subjetiva", label: "Febre subjetiva" },
      { id: "calafrios", label: "Calafrios" },
      { id: "sudorese_noturna", label: "Sudorese noturna" },
      { id: "perda_peso", label: "Perda de peso não intencional" },
      { id: "fadiga", label: "Fadiga / astenia importante" },
      { id: "anorexia", label: "Anorexia / inapetência" },
    ],
  },
  {
    id: "ent",
    title: "Olhos / Ouvidos / Nariz / Garganta",
    items: [
      { id: "cefaleia", label: "Cefaleia" },
      { id: "tontura", label: "Tontura / Vertigem" },
      { id: "alteracao_visual", label: "Alteração visual aguda" },
      { id: "odinofagia", label: "Odinofagia (dor de garganta)" },
      { id: "disfagia", label: "Disfagia" },
      { id: "otalgia", label: "Otalgia" },
      { id: "epistaxe", label: "Epistaxe" },
    ],
  },
  {
    id: "cardiovascular",
    title: "Cardiovascular",
    items: [
      { id: "palpitacoes", label: "Palpitações" },
      { id: "ortopneia", label: "Ortopneia" },
      { id: "dispneia_paroxistica", label: "Dispneia paroxística noturna" },
      { id: "claudicacao", label: "Claudicação intermitente" },
    ],
  },
  {
    id: "respiratorio_comp",
    title: "Respiratório",
    items: [
      { id: "tosse", label: "Tosse" },
      { id: "expectoracao", label: "Expectoração" },
      { id: "hemoptise", label: "Hemoptise" },
      { id: "dor_pleuritica", label: "Dor pleurítica (piora à inspiração)" },
    ],
  },
  {
    id: "gastrointestinal",
    title: "Gastrointestinal",
    items: [
      { id: "nausea_vomito", label: "Náuseas ou vômitos" },
      { id: "diarreia", label: "Diarreia" },
      { id: "constipacao", label: "Constipação" },
      { id: "hematemese", label: "Hematemese" },
      { id: "melena", label: "Melena / hematoquezia" },
    ],
  },
  {
    id: "geniturinario",
    title: "Geniturinário / Reprodutor",
    items: [
      { id: "disuria", label: "Disúria" },
      { id: "hematuria", label: "Hematúria" },
      { id: "polaciuria", label: "Polaciúria / urgência miccional" },
      { id: "corrimento", label: "Corrimento vaginal ou uretral anormal" },
      { id: "sangramento_vaginal", label: "Sangramento vaginal fora do padrão menstrual" },
      { id: "atraso_menstrual", label: "Atraso menstrual / possibilidade de gravidez" },
      { id: "dor_escrotal", label: "Dor ou edema testicular/escrotal" },
      { id: "lesao_genital", label: "Lesão genital" },
    ],
  },
  {
    id: "musculoesqueletico",
    title: "Musculoesquelético",
    items: [
      { id: "mialgia", label: "Mialgia difusa" },
      { id: "artralgia", label: "Artralgia" },
      { id: "edema_articular", label: "Edema articular" },
      { id: "dor_lombar", label: "Dor lombar" },
      { id: "fraqueza_muscular", label: "Fraqueza muscular localizada" },
    ],
  },
  {
    id: "neurologico_comp",
    title: "Neurológico (complementar)",
    items: [
      { id: "parestesias", label: "Parestesias" },
      { id: "tremor", label: "Tremor" },
      { id: "alteracao_marcha", label: "Alteração de marcha / equilíbrio" },
      { id: "perda_memoria", label: "Perda de memória recente" },
    ],
  },
  {
    id: "pele_mucosas",
    title: "Pele / Mucosas",
    items: [
      { id: "rash", label: "Rash / exantema novo" },
      { id: "prurido", label: "Prurido" },
      { id: "lesao_cutanea", label: "Lesão cutânea nova ou ferida que não cicatriza" },
      { id: "palidez", label: "Palidez" },
    ],
  },
  {
    id: "psiquiatrico",
    title: "Psiquiátrico",
    items: [
      { id: "ideacao_suicida", label: "Ideação suicida ou de morte" },
      { id: "ansiedade", label: "Ansiedade importante" },
      { id: "alteracao_humor", label: "Alteração de humor" },
      { id: "insonia", label: "Insônia" },
    ],
  },
  {
    id: "endocrino",
    title: "Endócrino / Hematológico",
    items: [
      { id: "poliuria", label: "Poliúria / polidipsia" },
      { id: "intolerancia_termica", label: "Intolerância ao calor ou frio" },
      { id: "sangramento_facil", label: "Sangramento fácil / equimoses espontâneas" },
      { id: "linfonodos", label: "Linfonodos aumentados" },
    ],
  },
];

export function buildEmptyChecklist(sections: FormSection[]) {
  return sections.reduce<Record<string, boolean>>((acc, section) => {
    section.items.forEach((item) => {
      acc[item.id] = false;
    });
    return acc;
  }, {});
}

export const ALL_EXAM_IDS = EXAM_SECTIONS.flatMap((s) => s.items.map((i) => i.id));
export const ALL_COMPLEMENTARY_IDS = COMPLEMENTARY_SECTIONS.flatMap((s) =>
  s.items.map((i) => i.id)
);
