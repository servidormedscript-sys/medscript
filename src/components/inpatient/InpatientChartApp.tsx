"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  INPATIENT_CHART_TABS,
  isInpatientChartTabId,
  type InpatientChartTabId,
} from "@/lib/inpatient/chart-tabs";
import type { LabAlert } from "@/lib/inpatient/lab-alerts";
import type { CriticalLabConduct } from "@/lib/inpatient/lab-critical-conduct";
import type {
  EpisodeConduct,
  EpisodeComorbidities,
  EpisodeDischarge,
  EpisodeInternacao,
  EpisodeEvolution,
  EpisodeProblem,
  EpisodeGeneralOrders,
  EpisodeHandoffTask,
  EpisodeImagingReport,
  EpisodeLabPending,
  EpisodeLabValue,
  EpisodeMedReconciliation,
  EpisodePhysicalExam,
  EpisodePrescription,
  EpisodeVitalRecord,
  PrescriptionInput,
} from "@/lib/types/inpatient-chart";
import { computeClinicalStatus } from "@/lib/inpatient/clinical-status";
import { signedEvolutionTimestamps } from "@/lib/inpatient/evolution-utils";
import { emptyEpisodeComorbidities } from "@/lib/inpatient/comorbidities";
import type { Patient, PatientEpisode } from "@/lib/types/patient";
import ConductTab from "./ConductTab";
import DischargeTab from "./DischargeTab";
import InternacaoTab from "./InternacaoTab";
import ResumoTab from "./ResumoTab";
import EvolutionTab from "./EvolutionTab";
import InpatientChartHeader from "./InpatientChartHeader";
import LabExamsTab from "./LabExamsTab";
import PhysicalExamTab from "./PhysicalExamTab";
import PrescriptionTab from "./PrescriptionTab";
import VitalsTab from "./VitalsTab";

export type LabChartBundle = {
  values: EpisodeLabValue[];
  pending: EpisodeLabPending[];
  imaging: EpisodeImagingReport[];
  alerts: LabAlert[];
  criticalConducts: CriticalLabConduct[];
};

const EMPTY_LAB_BUNDLE: LabChartBundle = {
  values: [],
  pending: [],
  imaging: [],
  alerts: [],
  criticalConducts: [],
};

const IMPLEMENTED_TABS = new Set([
  "resumo",
  "vitais",
  "exame-fisico",
  "evolucao",
  "exames",
  "prescricao",
  "conduta",
  "aih",
  "alta",
]);

type Props = {
  episode: PatientEpisode;
  patient: Patient;
  initialTab?: string;
};

export default function InpatientChartApp({
  episode,
  patient,
  initialTab,
}: Props) {
  const tabFromUrl =
    initialTab && isInpatientChartTabId(initialTab) ? initialTab : "resumo";
  const [activeTab, setActiveTab] = useState<InpatientChartTabId>(tabFromUrl);
  const [vitals, setVitals] = useState<EpisodeVitalRecord[]>([]);
  const [exams, setExams] = useState<EpisodePhysicalExam[]>([]);
  const [evolutions, setEvolutions] = useState<EpisodeEvolution[]>([]);
  const [prescriptions, setPrescriptions] = useState<EpisodePrescription[]>(
    [],
  );
  const [reconciliation, setReconciliation] = useState<
    EpisodeMedReconciliation[]
  >([]);
  const [generalOrders, setGeneralOrders] =
    useState<EpisodeGeneralOrders | null>(null);
  const [labBundle, setLabBundle] = useState<LabChartBundle>(EMPTY_LAB_BUNDLE);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [conduct, setConduct] = useState<EpisodeConduct | null>(null);
  const [handoffTasks, setHandoffTasks] = useState<EpisodeHandoffTask[]>([]);
  const [discharge, setDischarge] = useState<EpisodeDischarge | null>(null);
  const [internacao, setInternacao] = useState<EpisodeInternacao | null>(null);
  const [altaConfirmed, setAltaConfirmed] = useState(false);
  const [pendingReconciliation, setPendingReconciliation] = useState(0);
  const [problems, setProblems] = useState<EpisodeProblem[]>([]);
  const [comorbidities, setComorbidities] = useState<EpisodeComorbidities | null>(
    null,
  );

  const loadChartData = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    const [vRes, eRes, evRes, rxRes, labRes, condRes, altaRes, intRes, painelRes] =
      await Promise.all([
      fetch(`/api/pacientes/episodios/${episode.id}/vitais`),
      fetch(`/api/pacientes/episodios/${episode.id}/exame-fisico`),
      fetch(`/api/pacientes/episodios/${episode.id}/evolucoes`),
      fetch(`/api/pacientes/episodios/${episode.id}/prescricao`),
      fetch(`/api/pacientes/episodios/${episode.id}/exames-laboratorio`),
      fetch(`/api/pacientes/episodios/${episode.id}/conduta`),
      fetch(`/api/pacientes/episodios/${episode.id}/alta`),
      fetch(`/api/pacientes/episodios/${episode.id}/internacao`),
      fetch(`/api/pacientes/episodios/${episode.id}/painel-clinico`),
    ]);
    const vData = await vRes.json();
    const eData = await eRes.json();
    const evData = await evRes.json();
    const rxData = await rxRes.json();
    const labData = await labRes.json();
    const condData = await condRes.json();
    const altaData = await altaRes.json();
    const intData = await intRes.json();
    const painelData = await painelRes.json();
    setLoading(false);
    if (
      !vRes.ok ||
      !eRes.ok ||
      !evRes.ok ||
      !rxRes.ok ||
      !labRes.ok ||
      !condRes.ok ||
      !altaRes.ok ||
      !intRes.ok ||
      !painelRes.ok
    ) {
      setLoadError(
        vData.error ??
          eData.error ??
          evData.error ??
          rxData.error ??
          labData.error ??
          condData.error ??
          altaData.error ??
          intData.error ??
          painelData.error ??
          "Não foi possível carregar o prontuário.",
      );
      return;
    }
    setVitals(vData.records ?? []);
    setExams(eData.exams ?? []);
    setEvolutions(evData.evolutions ?? []);
    setPrescriptions(rxData.prescriptions ?? []);
    setReconciliation(rxData.reconciliation ?? []);
    setGeneralOrders(rxData.generalOrders ?? null);
    setLabBundle({
      values: labData.values ?? [],
      pending: labData.pending ?? [],
      imaging: labData.imaging ?? [],
      alerts: labData.alerts ?? [],
      criticalConducts: labData.criticalConducts ?? [],
    });
    setConduct(condData.conduct ?? null);
    setHandoffTasks(condData.tasks ?? []);
    setDischarge(altaData.discharge ?? null);
    setInternacao(intData.internacao ?? null);
    setAltaConfirmed(Boolean(intData.alta_confirmed));
    setPendingReconciliation(
      altaData.pending_reconciliation ?? intData.pending_reconciliation ?? 0,
    );
    setProblems(painelData.problems ?? []);
    setComorbidities(painelData.comorbidities ?? null);
  }, [episode.id]);

  const addPrescription = useCallback(
    async (input: PrescriptionInput) => {
      const res = await fetch(
        `/api/pacientes/episodios/${episode.id}/prescricao`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        },
      );
      const data = await res.json();
      if (!res.ok) return false;
      setPrescriptions((prev) => [data.prescription, ...prev]);
      return true;
    },
    [episode.id],
  );

  useEffect(() => {
    loadChartData();
  }, [loadChartData]);

  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set("tab", activeTab);
    window.history.replaceState(null, "", url.toString());
  }, [activeTab]);

  const clinicalStatus = useMemo(
    () =>
      computeClinicalStatus({
        vitalRecords: vitals,
        labValues: labBundle.values,
        evolutionTimestamps: signedEvolutionTimestamps(evolutions),
        admissionAt: episode.created_at,
        birthDate: patient.birth_date,
      }),
    [
      vitals,
      labBundle.values,
      evolutions,
      episode.created_at,
      patient.birth_date,
    ],
  );

  const tabNav = useMemo(
    () =>
      INPATIENT_CHART_TABS.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => setActiveTab(t.id)}
          className={`shrink-0 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
            activeTab === t.id
              ? "bg-navy-900 text-white"
              : "text-navy-800/75 hover:bg-navy-50 hover:text-navy-950"
          }`}
        >
          {t.label}
        </button>
      )),
    [activeTab],
  );

  return (
    <div className="-mx-4 -mt-4 flex min-h-[calc(100dvh-8rem)] flex-col bg-gradient-to-br from-ocean-50/40 via-white to-navy-50/30 sm:-mx-6 lg:-mx-8">
      <div className="border-b border-navy-900/8 bg-white/90 px-4 py-2 sm:px-6 lg:px-8">
        <Link
          href="/dashboard/relatorio-pacientes"
          className="text-sm text-navy-800/65 hover:text-navy-950"
        >
          ← Voltar ao relatório de pacientes
        </Link>
      </div>

      <InpatientChartHeader
        episode={episode}
        patient={patient}
        clinicalStatus={clinicalStatus}
        codeStatus={conduct?.code_status}
      />

      <nav
        className="sticky top-0 z-20 flex gap-1 overflow-x-auto border-b border-navy-900/8 bg-white/95 px-4 py-2 backdrop-blur-sm sm:px-6 lg:px-8"
        aria-label="Abas do prontuário"
      >
        {tabNav}
      </nav>

      <div className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
        {loading && (
          <p className="text-sm text-navy-800/60">Carregando prontuário...</p>
        )}
        {loadError && (
          <p className="text-sm text-red-700" role="alert">{loadError}</p>
        )}

        {!loading && !loadError && activeTab === "resumo" && (
          <ResumoTab
            episodeId={episode.id}
            birthDate={patient.birth_date}
            clinicalStatus={clinicalStatus}
            vitals={vitals}
            exams={exams}
            evolutions={evolutions}
            conductText={conduct?.conduct_text ?? null}
            labAlerts={labBundle.alerts}
            criticalConducts={labBundle.criticalConducts}
            labValues={labBundle.values}
            pendingLabs={labBundle.pending}
            pendingReconciliation={pendingReconciliation}
            codeStatus={conduct?.code_status ?? null}
            episode={episode}
            paduaFilled={Boolean(
              generalOrders &&
                (Object.values(generalOrders.padua_score ?? {}).some(Boolean) ||
                  Object.values(generalOrders.caprini_score ?? {}).some(
                    Boolean,
                  )),
            )}
            problems={problems}
            comorbidities={
              comorbidities ?? emptyEpisodeComorbidities(episode.id)
            }
            counts={{
              vitals: vitals.length,
              exams: exams.length,
              evolutions: evolutions.length,
              activeRx: prescriptions.filter((p) => !p.suspended_at).length,
              labAlerts: labBundle.alerts.length,
              imagingReports: labBundle.imaging.length,
            }}
            onProblemsChange={setProblems}
            onComorbiditiesChange={setComorbidities}
            onNavigateTab={setActiveTab}
          />
        )}

        {!loading && !loadError && activeTab === "vitais" && (
          <>
            {clinicalStatus.evolutionDelayAlert !== "none" && (
              <p
                className={`mb-4 rounded-md border px-3 py-2 text-sm ${
                  clinicalStatus.evolutionDelayAlert === "high"
                    ? "border-red-200 bg-red-50 text-red-900"
                    : "border-amber-200 bg-amber-50 text-amber-950"
                }`}
                role="alert"
              >
                {clinicalStatus.evolutionDelayAlert === "high"
                  ? "Evolução atrasada há 24h ou mais — priorize registro na aba Evolução."
                  : "Evolução atrasada há 12h ou mais — considere registrar evolução."}
              </p>
            )}
            <VitalsTab
              episodeId={episode.id}
              birthDate={patient.birth_date}
              records={vitals}
              onRecordsChange={setVitals}
            />
          </>
        )}

        {!loading && !loadError && activeTab === "exame-fisico" && (
          <PhysicalExamTab
            episodeId={episode.id}
            exams={exams}
            onExamsChange={setExams}
          />
        )}

        {!loading && !loadError && activeTab === "evolucao" && (
          <EvolutionTab
            episodeId={episode.id}
            patient={patient}
            episode={episode}
            vitalRecords={vitals}
            physicalExams={exams}
            evolutions={evolutions}
            onEvolutionsChange={setEvolutions}
            prescriptions={prescriptions}
            reconciliation={reconciliation}
            onAddPrescription={addPrescription}
            labValues={labBundle.values}
            imagingReports={labBundle.imaging}
            conduct={conduct}
            onConductChange={setConduct}
            comorbidities={comorbidities}
            problems={problems}
            dischargeConfirmed={Boolean(discharge?.confirmed_at)}
          />
        )}

        {!loading && !loadError && activeTab === "exames" && (
          <LabExamsTab
            episodeId={episode.id}
            bundle={labBundle}
            onBundleChange={setLabBundle}
            onAddPrescription={addPrescription}
          />
        )}

        {!loading &&
          !loadError &&
          activeTab === "conduta" &&
          conduct &&
          generalOrders && (
            <ConductTab
              episodeId={episode.id}
              episode={episode}
              patient={patient}
              conduct={conduct}
              tasks={handoffTasks}
              prescriptions={prescriptions}
              labValues={labBundle.values}
              generalOrders={generalOrders}
              clinicalStatus={clinicalStatus}
              onConductChange={setConduct}
              onTasksChange={setHandoffTasks}
              onGeneralOrdersChange={setGeneralOrders}
            />
          )}

        {!loading && !loadError && activeTab === "aih" && internacao && (
          <InternacaoTab
            episodeId={episode.id}
            episode={episode}
            patient={patient}
            internacao={internacao}
            pendingReconciliation={pendingReconciliation}
            altaConfirmed={altaConfirmed}
            vitals={vitals}
            exams={exams}
            evolutions={evolutions}
            prescriptions={prescriptions}
            reconciliation={reconciliation}
            labValues={labBundle.values}
            imaging={labBundle.imaging}
            conduct={conduct}
            onInternacaoChange={setInternacao}
            onNavigateAlta={() => setActiveTab("alta")}
          />
        )}

        {!loading && !loadError && activeTab === "alta" && discharge && (
            <DischargeTab
              episodeId={episode.id}
              episode={episode}
              patient={patient}
              discharge={discharge}
              pendingReconciliation={pendingReconciliation}
              clinicalStatus={clinicalStatus}
              vitals={vitals}
              exams={exams}
              evolutions={evolutions}
              prescriptions={prescriptions}
              reconciliation={reconciliation}
              labValues={labBundle.values}
              imaging={labBundle.imaging}
              conduct={conduct}
              onDischargeChange={setDischarge}
            />
          )}

        {!loading &&
          !loadError &&
          activeTab === "prescricao" &&
          generalOrders && (
            <PrescriptionTab
              episodeId={episode.id}
              episode={episode}
              patient={patient}
              prescriptions={prescriptions}
              reconciliation={reconciliation}
              generalOrders={generalOrders}
              onPrescriptionsChange={setPrescriptions}
              onReconciliationChange={setReconciliation}
              onGeneralOrdersChange={setGeneralOrders}
            />
          )}

        {!loading &&
          !loadError &&
          !IMPLEMENTED_TABS.has(activeTab) && (
            <div className="rounded-lg border border-dashed border-navy-900/15 bg-white/80 p-8 text-center">
              <p className="text-sm font-medium text-navy-950">
                {INPATIENT_CHART_TABS.find((t) => t.id === activeTab)?.label}
              </p>
              <p className="mt-2 text-sm text-navy-800/65">
                Esta aba será implementada na sequência do plano de internação.
              </p>
            </div>
          )}
      </div>
    </div>
  );
}
