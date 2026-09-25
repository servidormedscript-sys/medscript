import type { ComponentType } from "react";
import PcrAdultoProtocol from "@/components/dashboard/protocolos/interactive/PcrAdultoProtocol";
import BradiarritmiasProtocol from "@/components/dashboard/protocolos/interactive/cardiology/BradiarritmiasProtocol";
import TaqiarritmiasProtocol from "@/components/dashboard/protocolos/interactive/cardiology/TaqiarritmiasProtocol";
import IamSupraProtocol from "@/components/dashboard/protocolos/interactive/cardiology/IamSupraProtocol";
import CriseHipertensivaProtocol from "@/components/dashboard/protocolos/interactive/cardiology/CriseHipertensivaProtocol";
import EapProtocol from "@/components/dashboard/protocolos/interactive/cardiology/EapProtocol";
import IcadProtocol from "@/components/dashboard/protocolos/interactive/cardiology/IcadProtocol";
import ScaSemSupraProtocol from "@/components/dashboard/protocolos/interactive/cardiology/ScaSemSupraProtocol";
import AvcProtocol from "@/components/dashboard/protocolos/interactive/neurologia/AvcProtocol";
import RebaixamentoProtocol from "@/components/dashboard/protocolos/interactive/neurologia/RebaixamentoProtocol";
import ConvulsaoProtocol from "@/components/dashboard/protocolos/interactive/neurologia/ConvulsaoProtocol";
import CetoProtocol from "@/components/dashboard/protocolos/interactive/metabolico/CetoProtocol";
import EletrolitosProtocol from "@/components/dashboard/protocolos/interactive/metabolico/EletrolitosProtocol";
import GlicemiaProtocol from "@/components/dashboard/protocolos/interactive/metabolico/GlicemiaProtocol";
import AsmaProtocol from "@/components/dashboard/protocolos/interactive/respiratorio/AsmaProtocol";
import TepProtocol from "@/components/dashboard/protocolos/interactive/respiratorio/TepProtocol";
import HdaProtocol from "@/components/dashboard/protocolos/interactive/gastroenterologia/HdaProtocol";
import ObstProtocol from "@/components/dashboard/protocolos/interactive/obstetricia/ObstProtocol";
import AgitacaoProtocol from "@/components/dashboard/protocolos/interactive/saude-mental/AgitacaoProtocol";
import SuicidioProtocol from "@/components/dashboard/protocolos/interactive/saude-mental/SuicidioProtocol";
import AbstinenciaProtocol from "@/components/dashboard/protocolos/interactive/saude-mental/AbstinenciaProtocol";
import PsicoseProtocol from "@/components/dashboard/protocolos/interactive/saude-mental/PsicoseProtocol";
import DeliriumProtocol from "@/components/dashboard/protocolos/interactive/manejo-uti/DeliriumProtocol";
import DorProtocol from "@/components/dashboard/protocolos/interactive/manejo-uti/DorProtocol";
import GotejamentoTool from "@/components/dashboard/protocolos/interactive/ferramentas/GotejamentoTool";
import RenalTool from "@/components/dashboard/protocolos/interactive/ferramentas/RenalTool";
import InteracoesTool from "@/components/dashboard/protocolos/interactive/ferramentas/InteracoesTool";
import AntibioticosTool from "@/components/dashboard/protocolos/interactive/ferramentas/AntibioticosTool";
import GasometriaTool from "@/components/dashboard/protocolos/interactive/ferramentas/GasometriaTool";
import EcgTool from "@/components/dashboard/protocolos/interactive/ferramentas/EcgTool";
import EscoresTool from "@/components/dashboard/protocolos/interactive/ferramentas/EscoresTool";
import SepseProtocol from "@/components/dashboard/protocolos/interactive/emergencia/SepseProtocol";
import TraumaGraveProtocol from "@/components/dashboard/protocolos/interactive/emergencia/TraumaGraveProtocol";
import IsquemiaArterialProtocol from "@/components/dashboard/protocolos/interactive/emergencia/IsquemiaArterialProtocol";
import AbdomeAgudoProtocol from "@/components/dashboard/protocolos/interactive/emergencia/AbdomeAgudoProtocol";
import AnafilaxiaProtocol from "@/components/dashboard/protocolos/interactive/emergencia/AnafilaxiaProtocol";
import ChoqueHemorragicoProtocol from "@/components/dashboard/protocolos/interactive/emergencia/ChoqueHemorragicoProtocol";
import IsrProtocol from "@/components/dashboard/protocolos/interactive/emergencia/IsrProtocol";
import PcrPediatriaProtocol from "@/components/dashboard/protocolos/interactive/PcrPediatriaProtocol";
import MeningiteProtocol from "@/components/dashboard/protocolos/interactive/neurologia/MeningiteProtocol";
import DpocProtocol from "@/components/dashboard/protocolos/interactive/respiratorio/DpocProtocol";
import IntoxicacaoProtocol from "@/components/dashboard/protocolos/interactive/saude-mental/IntoxicacaoProtocol";
import PeconhentosProtocol from "@/components/dashboard/protocolos/interactive/emergencia/PeconhentosProtocol";
import HemotransfusaoProtocol from "@/components/dashboard/protocolos/interactive/emergencia/HemotransfusaoProtocol";
import CrisePanicoProtocol from "@/components/dashboard/protocolos/interactive/saude-mental/CrisePanicoProtocol";
import SedacaoProtocol from "@/components/dashboard/protocolos/interactive/manejo-uti/SedacaoProtocol";

export const INTERACTIVE_PROTOCOLS: Record<string, ComponentType> = {
  "pcr-adulto": PcrAdultoProtocol,
  "pcr-pediatria": PcrPediatriaProtocol,
  anafilaxia: AnafilaxiaProtocol,
  isr: IsrProtocol,
  bradicardia: BradiarritmiasProtocol,
  "taquicardia-instavel": TaqiarritmiasProtocol,
  "choque-hemorragico": ChoqueHemorragicoProtocol,
  "sepse-choque": SepseProtocol,
  "trauma-grave": TraumaGraveProtocol,
  "isquemia-arterial-membro": IsquemiaArterialProtocol,
  "abdome-agudo": AbdomeAgudoProtocol,
  taquiarritmias: TaqiarritmiasProtocol,
  bradiarritmias: BradiarritmiasProtocol,
  "iam-supra-st": IamSupraProtocol,
  "crise-hipertensiva": CriseHipertensivaProtocol,
  "edema-pulmao": EapProtocol,
  "ic-aguda-descompensada": IcadProtocol,
  "sca-sem-supra-st": ScaSemSupraProtocol,
  avc: AvcProtocol,
  meningite: MeningiteProtocol,
  cad: CetoProtocol,
  "disturbios-eletroliticos": EletrolitosProtocol,
  glicemia: GlicemiaProtocol,
  asma: AsmaProtocol,
  dpoc: DpocProtocol,
  tep: TepProtocol,
  "rebaixamento-consciencia": RebaixamentoProtocol,
  "crise-convulsiva": ConvulsaoProtocol,
  "status-epilepticus": ConvulsaoProtocol,
  hda: HdaProtocol,
  "emergencias-obstetricas": ObstProtocol,
  agitacao: AgitacaoProtocol,
  "risco-suicidio": SuicidioProtocol,
  overdose: SuicidioProtocol,
  "abstinencia-alcoolica": AbstinenciaProtocol,
  "psicose-aguda": PsicoseProtocol,
  intoxicacao: IntoxicacaoProtocol,
  "animais-peconhentos": PeconhentosProtocol,
  hemotransfusao: HemotransfusaoProtocol,
  "crise-panico": CrisePanicoProtocol,
  delirium: DeliriumProtocol,
  "dor-escada-analgesica": DorProtocol,
  sedacao: SedacaoProtocol,
  "calculadora-gotejamento": GotejamentoTool,
  "funcao-renal": RenalTool,
  "interacao-medicamentosa": InteracoesTool,
  antibioticos: AntibioticosTool,
  gasometria: GasometriaTool,
  "assistente-ecg": EcgTool,
  "hub-escores": EscoresTool,
  creatinina: RenalTool,
};

export function getInteractiveProtocol(protocolId: string): ComponentType | null {
  return INTERACTIVE_PROTOCOLS[protocolId] ?? null;
}

export function hasInteractiveProtocol(protocolId: string): boolean {
  return protocolId in INTERACTIVE_PROTOCOLS;
}
