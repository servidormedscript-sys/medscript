import type { SchoolPhase } from "./types";

/**
 * Trilha da Escola de Emergência — ajuste os tópicos conforme o material oficial (PDF).
 * Módulos podem apontar para Protocolos Clínicos via relatedProtocolCategoryId / relatedProtocolIds.
 */
export const EMERGENCY_SCHOOL_PHASES: SchoolPhase[] = [
  {
    id: "fundamentos",
    order: 1,
    title: "Fundamentos do atendimento",
    subtitle: "Avaliação inicial, priorização e segurança do paciente.",
    accentClass: "from-ocean-600 to-ocean-800",
    modules: [
      {
        id: "abcde-avaliacao-primaria",
        phaseId: "fundamentos",
        title: "ABCDE e avaliação primária",
        description:
          "Sequência estruturada de abordagem do paciente crítico na sala de emergência.",
        durationLabel: "45 min",
        objectives: [
          "Reconhecer instabilidade hemodinâmica e respiratória precocemente",
          "Aplicar ABCDE de forma simultânea e repetível",
          "Identificar quando acionar equipe e recursos avançados",
        ],
      },
      {
        id: "sinais-vitais-monitorizacao",
        phaseId: "fundamentos",
        title: "Sinais vitais e monitorização",
        description:
          "Interpretação de PA, FC, FR, SpO₂, temperatura e perfusão periférica.",
        durationLabel: "35 min",
        objectives: [
          "Correlacionar sinais vitais com mecanismos fisiopatológicos",
          "Definir frequência de reavaliação conforme gravidade",
          "Registrar tendências, não apenas valores isolados",
        ],
      },
      {
        id: "anamnese-rapida-emergencia",
        phaseId: "fundamentos",
        title: "Anamnese dirigida na urgência",
        description:
          "Coleta focada em tempo, queixa principal, red flags e comorbidades.",
        durationLabel: "30 min",
        objectives: [
          "Priorizar perguntas de alto impacto em poucos minutos",
          "Reconhecer síndromes clínicas comuns na emergência",
          "Documentar de forma clara para passagem de plantão",
        ],
      },
    ],
  },
  {
    id: "reanimacao-vias-aereas",
    order: 2,
    title: "Reanimação e vias aéreas",
    subtitle: "Suporte básico de vida, oxigenoterapia e manejo inicial da via aérea.",
    accentClass: "from-red-600 to-med-red",
    modules: [
      {
        id: "bls-adulto-pediatria",
        phaseId: "reanimacao-vias-aereas",
        title: "Suporte básico de vida (adulto e pediatria)",
        description:
          "Compressões, ventilação e desfibrilação precoce em parada cardiorrespiratória.",
        durationLabel: "50 min",
        objectives: [
          "Executar RCP de alta qualidade",
          "Adaptar relação compressão-ventilação por faixa etária",
          "Integrar desfibrilação e medicações conforme protocolo",
        ],
        relatedProtocolCategoryId: "emergencia",
        relatedProtocolIds: ["pcr-adulto", "pcr-pediatria"],
      },
      {
        id: "via-aerea-oxigenoterapia",
        phaseId: "reanimacao-vias-aereas",
        title: "Via aérea e oxigenoterapia",
        description:
          "Dispositivos, indicações de O₂, VNI e sinais de falência respiratória iminente.",
        durationLabel: "40 min",
        objectives: [
          "Escolher dispositivo de oxigenoterapia adequado",
          "Reconhecer indicações de via aérea avançada precoce",
          "Antecipar preparo para intubação ou via alternativa",
        ],
        relatedProtocolCategoryId: "respiratorio",
      },
      {
        id: "choque-ressuscitacao-volemica",
        phaseId: "reanimacao-vias-aereas",
        title: "Choque e ressuscitação volêmica",
        description:
          "Tipos de choque, fluidos, vasopressores e metas hemodinâmicas iniciais.",
        durationLabel: "45 min",
        objectives: [
          "Classificar choque (hipovolêmico, distributivo, cardiogênico, obstrutivo)",
          "Iniciar reposição guiada por resposta clínica",
          "Reconhecer limites de volume e necessidade de drogas vasoativas",
        ],
        relatedProtocolCategoryId: "emergencia",
      },
    ],
  },
  {
    id: "situacoes-criticas",
    order: 3,
    title: "Situações críticas frequentes",
    subtitle: "Cardiovascular, neurológico, respiratório e metabólico na urgência.",
    accentClass: "from-violet-600 to-violet-800",
    modules: [
      {
        id: "sca-eap-arrhythmias",
        phaseId: "situacoes-criticas",
        title: "SCA, edema agudo e arritmias",
        description:
          "Dor torácica, IAM, EAP e taquiarritmias instáveis — condutas iniciais.",
        durationLabel: "55 min",
        objectives: [
          "Estratificar risco em síndrome coronariana aguda",
          "Iniciar terapia antitrombótica e anti-isquêmica conforme protocolo",
          "Reconhecer arritmias com instabilidade hemodinâmica",
        ],
        relatedProtocolCategoryId: "cardiologia",
      },
      {
        id: "avc-convulsao",
        phaseId: "situacoes-criticas",
        title: "AVC e convulsão na emergência",
        description:
          "Janela terapêutica, escala NIHSS simplificada e manejo do status epilepticus.",
        durationLabel: "45 min",
        objectives: [
          "Diferenciar AVC isquêmico e hemorrágico na suspeita inicial",
          "Acionar fluxo de neurovascular precocemente",
          "Tratar convulsão prolongada com sequência medicamentosa",
        ],
        relatedProtocolCategoryId: "neurologia",
        relatedProtocolIds: ["crise-convulsiva"],
      },
      {
        id: "sepse-metabolico",
        phaseId: "situacoes-criticas",
        title: "Sepse, hipoglicemia e emergências metabólicas",
        description:
          "Bundles iniciais, glicemia capilar e correção de distúrbios agudos.",
        durationLabel: "40 min",
        objectives: [
          "Aplicar medidas da primeira hora em sepse",
          "Tratar hipoglicemia e cetoacidose de forma segura",
          "Monitorar resposta e complicações do tratamento",
        ],
        relatedProtocolCategoryId: "metabolico",
      },
    ],
  },
  {
    id: "trauma-procedimentos",
    order: 4,
    title: "Trauma e procedimentos",
    subtitle: "Abordagem do politraumatizado e habilidades práticas essenciais.",
    accentClass: "from-amber-600 to-orange-700",
    modules: [
      {
        id: "atls-principios",
        phaseId: "trauma-procedimentos",
        title: "Princípios ATLS na sala de emergência",
        description:
          "XABCDE, controle de hemorragia, imobilização e priorização de lesões.",
        durationLabel: "50 min",
        objectives: [
          "Aplicar sequência XABCDE no trauma",
          "Identificar sangramento exsanguinante e choque hemorrágico",
          "Definir prioridade de exames e especialidades",
        ],
      },
      {
        id: "acessos-procedimentos",
        phaseId: "trauma-procedimentos",
        title: "Acessos venosos e procedimentos de urgência",
        description:
          "Acesso periférico, intraósseo, toracocentese de alívio e sutura básica.",
        durationLabel: "45 min",
        objectives: [
          "Escolher via de acesso conforme cenário clínico",
          "Reconhecer indicações de procedimentos salvadores imediatos",
          "Prevenir complicações iatrogênicas",
        ],
      },
      {
        id: "anafilaxia-intoxicacao",
        phaseId: "trauma-procedimentos",
        title: "Anafilaxia e intoxicações",
        description:
          "Adrenalina precoce, suporte ventilatório e condutas iniciais em overdose.",
        durationLabel: "35 min",
        objectives: [
          "Diagnosticar anafilaxia e tratar com adrenalina IM",
          "Estabilizar via aérea e pressão arterial",
          "Iniciar medidas de descontaminação quando indicado",
        ],
        relatedProtocolCategoryId: "emergencia",
        relatedProtocolIds: ["anafilaxia"],
      },
    ],
  },
  {
    id: "integracao-plantao",
    order: 5,
    title: "Integração na prática",
    subtitle: "Comunicação em equipe, segurança do paciente e rotina de plantão.",
    accentClass: "from-navy-700 to-ocean-900",
    modules: [
      {
        id: "comunicacao-equipe",
        phaseId: "integracao-plantao",
        title: "Comunicação e trabalho em equipe",
        description:
          "SBAR, briefing, checklists e handoff entre plantonistas e estudantes.",
        durationLabel: "30 min",
        objectives: [
          "Usar comunicação estruturada em situações críticas",
          "Reduzir erro por falha de passagem de informação",
          "Integrar estudante ao fluxo assistencial com supervisão",
        ],
      },
      {
        id: "seguranca-paciente",
        phaseId: "integracao-plantao",
        title: "Segurança do paciente na emergência",
        description:
          "Dupla checagem, alergias, doses e prevenção de eventos adversos.",
        durationLabel: "30 min",
        objectives: [
          "Aplicar checagens antes de medicações de alto risco",
          "Reconhecer fatores humanos em ambiente de alta demanda",
          "Documentar incidentes e condutas corretivas",
        ],
      },
      {
        id: "simulacao-checklist-plantao",
        phaseId: "integracao-plantao",
        title: "Simulação e checklist de plantão",
        description:
          "Consolidar a trilha com casos integrados e rotina de início/fim de plantão.",
        durationLabel: "40 min",
        objectives: [
          "Executar caso clínico completo com priorização correta",
          "Revisar recursos, contatos e fluxos da unidade",
          "Planejar estudo contínuo com protocolos da plataforma",
        ],
        relatedProtocolCategoryId: "emergencia",
      },
    ],
  },
];

export function getAllSchoolModules() {
  return EMERGENCY_SCHOOL_PHASES.flatMap((phase) => phase.modules);
}

export function getSchoolModuleById(moduleId: string) {
  return getAllSchoolModules().find((module) => module.id === moduleId) ?? null;
}
