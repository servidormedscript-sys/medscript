import type { LegalDocument } from "./types";

export const legalDocuments: Record<string, LegalDocument> = {
  "termos-de-uso": {
    slug: "termos-de-uso",
    title: "Termos de Uso",
    description: "Regras de utilização da plataforma MEDScript.",
    sections: [
      {
        heading: "1. Aceitação",
        paragraphs: [
          "Ao acessar ou utilizar o MEDScript, você concorda com estes Termos de Uso. Se não concordar, não utilize a plataforma.",
          "O MEDScript é uma ferramenta de apoio à gestão clínica e decisão assistencial. Não substitui o julgamento profissional, protocolos institucionais ou normas dos conselhos de classe.",
        ],
      },
      {
        heading: "2. Elegibilidade e conta",
        paragraphs: [
          "O cadastro é destinado a profissionais e clínicas que atuam na área da saúde. Você deve fornecer informações verdadeiras e manter suas credenciais em sigilo.",
          "O administrador da clínica é responsável pelos sub-usuários criados na conta e pelo uso da plataforma por sua equipe.",
        ],
      },
      {
        heading: "3. Uso permitido",
        paragraphs: [
          "Você pode utilizar o MEDScript para registro assistencial, organização de plantões, consulta a protocolos, gestão de documentos institucionais e demais funcionalidades disponíveis no seu plano.",
          "É proibido usar a plataforma para fins ilícitos, compartilhar acesso com terceiros não autorizados, tentar acessar dados de outras clínicas ou interferir no funcionamento do sistema.",
        ],
      },
      {
        heading: "4. Conteúdo e responsabilidade clínica",
        paragraphs: [
          "Dados inseridos na plataforma são de responsabilidade da clínica e dos profissionais que os registram. O MEDScript não garante resultados clínicos e não assume decisões médicas tomadas com base nas informações exibidas.",
          "Protocolos e calculadoras são materiais de apoio. Sempre valide condutas conforme a realidade do paciente e diretrizes locais.",
        ],
      },
      {
        heading: "5. Disponibilidade e alterações",
        paragraphs: [
          "Buscamos alta disponibilidade, mas manutenções e indisponibilidades temporárias podem ocorrer. Funcionalidades podem ser atualizadas, incluídas ou descontinuadas com aviso prévio quando aplicável.",
          "Estes termos podem ser atualizados. A data da última revisão será indicada no rodapé de cada página legal.",
        ],
      },
      {
        heading: "6. Contato",
        paragraphs: [
          "Dúvidas sobre estes Termos de Uso podem ser enviadas pelo Instagram oficial @medscript.app ou pelos canais informados no painel da plataforma.",
        ],
      },
    ],
  },
  "termos-e-condicoes": {
    slug: "termos-e-condicoes",
    title: "Termos e Condições",
    description: "Condições comerciais do serviço MEDScript.",
    sections: [
      {
        heading: "1. Objeto do serviço",
        paragraphs: [
          "O MEDScript é oferecido como software na modalidade SaaS (Software as a Service), com acesso via internet, plano Profissional e funcionalidades descritas no site e no painel.",
        ],
      },
      {
        heading: "2. Plano e preço",
        paragraphs: [
          "O plano Profissional custa R$ 29,90 por 30 dias ou R$ 249,00 por 365 dias, por clínica, conforme divulgado no site no momento da contratação.",
          "Novos cadastros podem usufruir de 14 dias de avaliação gratuita, sem cobrança nesse período, salvo comunicação em contrário.",
        ],
      },
      {
        heading: "3. Pagamento",
        paragraphs: [
          "Após o período de avaliação, o plano pode ser contratado pelo Mercado Pago de duas formas: assinatura com renovação automática no cartão (mensal R$ 29,90 ou anual R$ 249,00) ou pagamento único com Pix, boleto ou cartão pelo mesmo valor e período (30 ou 365 dias), sem renovação automática. Cada cobrança aprovada soma dias ao saldo da clínica. O cancelamento da assinatura impede novas cobranças recorrentes; o acesso permanece até o fim dos dias já pagos.",
          "Para processar a cobrança, nome, e-mail e identificador da conta são compartilhados com o Mercado Pago.",
          "Alterações de preço serão comunicadas com antecedência razoável antes de passarem a valer para novos ciclos.",
        ],
      },
      {
        heading: "4. Propriedade intelectual",
        paragraphs: [
          "A marca MEDScript, interface, código e materiais proprietários pertencem aos titulares do produto. É concedida licença de uso limitada, não exclusiva e revogável enquanto a assinatura estiver ativa.",
          "Conteúdos inseridos pela clínica permanecem de titularidade da clínica, nos termos da Política de Privacidade e LGPD.",
        ],
      },
      {
        heading: "5. Suporte",
        paragraphs: [
          "Suporte operacional é prestado pelos canais oficiais da plataforma. Prazos de resposta podem variar conforme a natureza da solicitação.",
        ],
      },
      {
        heading: "6. Limitação de responsabilidade",
        paragraphs: [
          "Na extensão permitida pela lei, o MEDScript não se responsabiliza por danos indiretos, lucros cessantes ou decisões clínicas baseadas no uso da ferramenta.",
          "A responsabilidade total relacionada ao serviço fica limitada ao valor pago nos últimos 12 meses de assinatura, quando aplicável.",
        ],
      },
    ],
  },
  lgpd: {
    slug: "lgpd",
    title: "LGPD e Privacidade",
    description: "Como tratamos dados pessoais e sensíveis na plataforma.",
    sections: [
      {
        heading: "1. Controlador e finalidade",
        paragraphs: [
          "A clínica contratante atua como controladora dos dados de pacientes inseridos na plataforma. O MEDScript atua como operador na hospedagem, processamento e segurança desses dados, conforme instruções da clínica e estes termos.",
          "Tratamos dados para autenticação, operação do sistema, registro assistencial, comunicações operacionais e cumprimento de obrigações legais.",
        ],
      },
      {
        heading: "2. Dados coletados",
        paragraphs: [
          "Podemos tratar dados de cadastro (nome, e-mail, perfil profissional), dados de uso (logs, IP, dispositivo) e dados clínicos inseridos pela equipe (prontuários, avaliações, plantões, documentos).",
          "Dados sensíveis de saúde são tratados com base legal adequada, em especial a tutela da saúde e execução de contrato, com medidas reforçadas de segurança.",
        ],
      },
      {
        heading: "3. Compartilhamento",
        paragraphs: [
          "Não vendemos dados pessoais. Compartilhamento ocorre apenas com provedores essenciais (ex.: infraestrutura e autenticação), sob contratos e padrões compatíveis com a LGPD.",
          "Dados podem ser compartilhados por determinação legal ou ordem de autoridade competente.",
        ],
      },
      {
        heading: "4. Segurança",
        paragraphs: [
          "Adotamos controles técnicos e organizacionais como criptografia em trânsito, controle de acesso por perfil, segregação por clínica e monitoramento de incidentes.",
          "Em caso de incidente relevante, a clínica controladora será informada para cumprimento das obrigações legais aplicáveis.",
        ],
      },
      {
        heading: "5. Direitos do titular",
        paragraphs: [
          "Titulares podem solicitar confirmação de tratamento, acesso, correção, anonimização, portabilidade ou eliminação, conforme a LGPD. Solicitações sobre dados clínicos devem ser direcionadas preferencialmente à clínica responsável pelo atendimento.",
          "Pedidos relacionados à conta de usuário da plataforma podem ser feitos pelos canais oficiais do MEDScript.",
        ],
      },
      {
        heading: "6. Retenção",
        paragraphs: [
          "Dados são mantidos enquanto durar a relação contratual e pelo prazo necessário para obrigações legais, defesa de direitos e auditoria, salvo solicitação válida de eliminação compatível com a lei.",
        ],
      },
    ],
  },
  cancelamento: {
    slug: "cancelamento",
    title: "Regras de Cancelamento",
    description: "Como funciona o cancelamento do plano MEDScript.",
    sections: [
      {
        heading: "1. Avaliação gratuita",
        paragraphs: [
          "Durante os 14 dias de avaliação gratuita, você pode cancelar a qualquer momento sem cobrança. O acesso permanece ativo até o fim do período de teste, salvo encerramento antecipado solicitado.",
        ],
      },
      {
        heading: "2. Cancelamento da assinatura",
        paragraphs: [
          "Após a avaliação, você pode cancelar a renovação automática no cartão a qualquer momento na área Plano do painel (botão “Cancelar renovação automática”) ou pelos canais do Mercado Pago.",
          "O cancelamento impede novas cobranças recorrentes. O acesso permanece até o fim dos dias já pagos.",
          "O MEDScript não armazena dados completos de cartão de crédito. O cadastro do cartão e a tokenização ficam sob responsabilidade do Mercado Pago. Para remover o cartão salvo, use a conta do pagador no Mercado Pago.",
        ],
      },
      {
        heading: "3. Pix, boleto e liberação de acesso",
        paragraphs: [
          "Pagamentos únicos com Pix, boleto ou cartão são processados pelo Mercado Pago. Quando o pagamento é aprovado, o sistema soma automaticamente os dias contratados ao saldo da clínica.",
          "Pix e cartão costumam ser confirmados em poucos minutos. Boleto bancário pode levar até 3 dias úteis (ou mais em feriados) para compensar; até a confirmação pelo Mercado Pago, o status permanece pendente e o acesso só é ampliado após a aprovação.",
          "A confirmação ocorre por retorno do checkout e por notificações (webhook) do Mercado Pago, sem necessidade de ação manual da equipe MEDScript.",
        ],
      },
      {
        heading: "4. Reembolso",
        paragraphs: [
          "Pedidos de reembolso de valores já pagos devem ser solicitados pelos canais oficiais de suporte em até 7 (sete) dias corridos a contar da data da cobrança aprovada.",
          "Após esse prazo, não há reembolso automático de mensalidades ou planos anuais já creditados, salvo determinação legal ou acordo expresso.",
          "Estornos seguem os prazos e regras do meio de pagamento (Mercado Pago) e da instituição financeira.",
        ],
      },
      {
        heading: "5. Dados após cancelamento",
        paragraphs: [
          "Recomendamos exportar fichas e documentos importantes antes do encerramento. Após o cancelamento, os dados podem ser mantidos por prazo limitado para backup e obrigações legais, sendo depois eliminados ou anonimizados conforme política interna.",
        ],
      },
      {
        heading: "6. Reativação",
        paragraphs: [
          "Contas canceladas podem ser reativadas mediante nova contratação, sujeita à disponibilidade dos dados remanescentes no prazo de retenção.",
        ],
      },
      {
        heading: "7. Suspensão por inadimplência",
        paragraphs: [
          "Falta de pagamento pode levar à suspensão temporária do acesso. Persistindo a inadimplência, a conta pode ser encerrada após comunicação prévia.",
        ],
      },
    ],
  },
  cookies: {
    slug: "cookies",
    title: "Uso de Cookies",
    description: "Como utilizamos cookies e tecnologias similares.",
    sections: [
      {
        heading: "1. O que são cookies",
        paragraphs: [
          "Cookies são pequenos arquivos armazenados no seu navegador para lembrar preferências, manter sessões e entender o uso do site de forma agregada.",
        ],
      },
      {
        heading: "2. Cookies essenciais",
        paragraphs: [
          "Utilizamos cookies necessários para autenticação, segurança da sessão e funcionamento do painel. Sem eles, partes da plataforma podem não operar corretamente.",
        ],
      },
      {
        heading: "3. Cookies de desempenho",
        paragraphs: [
          "Podemos usar cookies ou tecnologias similares para medir desempenho, detectar erros e melhorar a experiência. Quando possível, os dados são agregados e não identificam diretamente o usuário.",
        ],
      },
      {
        heading: "4. Cookies de terceiros",
        paragraphs: [
          "Login com Google ou outros provedores pode definir cookies de terceiros conforme as políticas desses serviços. Recomendamos consultar as políticas do provedor utilizado.",
        ],
      },
      {
        heading: "5. Gerenciamento",
        paragraphs: [
          "Você pode bloquear ou excluir cookies nas configurações do navegador. Isso pode afetar login e funcionalidades do MEDScript.",
          "Ao continuar navegando após o aviso de cookies, entendemos que você concorda com o uso conforme descrito nesta página e na Política de Privacidade.",
        ],
      },
    ],
  },
};

export const footerLegalLinks = [
  { href: "/termos-de-uso", label: "Termos de Uso" },
  { href: "/termos-e-condicoes", label: "Termos e Condições" },
  { href: "/lgpd", label: "LGPD e Privacidade" },
  { href: "/cancelamento", label: "Cancelamento" },
  { href: "/cookies", label: "Cookies" },
] as const;

export function getLegalDocument(slug: string) {
  return legalDocuments[slug] ?? null;
}
