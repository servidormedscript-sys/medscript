import { jsPDF } from "jspdf";
import type { PatientDocumentBundle } from "./types";
import {
  collectAssessmentEntries,
  displayValue,
  formatDate,
  formatDateTime,
  formatMovementLine,
  patientAgeLabel,
  patientSexLabel,
  episodeRiskLabel,
  episodeStatusLabel,
  sanitizeFilename,
} from "./formatters";
import { buildStatusTimesSummary } from "@/lib/patient-status-time";
import { buildCareSummaryExportLines } from "@/lib/patient-care-summary";
import { formatCpf } from "@/lib/utils/cpf";
import { drawPdfLogo, loadPdfLogoImage } from "@/lib/pdf/logo-for-pdf";

const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const MARGIN = 14;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const LINE_HEIGHT = 5.5;

function ensureSpace(doc: jsPDF, y: number, blockHeight: number) {
  if (y + blockHeight > PAGE_HEIGHT - MARGIN) {
    doc.addPage();
    return MARGIN;
  }
  return y;
}

function writeLines(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  options?: { fontSize?: number; fontStyle?: "normal" | "bold" }
) {
  doc.setFont("helvetica", options?.fontStyle ?? "normal");
  doc.setFontSize(options?.fontSize ?? 10);
  const lines = doc.splitTextToSize(text, CONTENT_WIDTH - (x - MARGIN));
  lines.forEach((line: string) => {
    y = ensureSpace(doc, y, LINE_HEIGHT);
    doc.text(line, x, y);
    y += LINE_HEIGHT;
  });
  return y;
}

function writeField(doc: jsPDF, label: string, value: string, y: number) {
  y = ensureSpace(doc, y, LINE_HEIGHT * 2);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text(label, MARGIN, y);
  y += LINE_HEIGHT;
  return writeLines(doc, value, MARGIN, y, { fontSize: 10 });
}

async function drawHeader(doc: jsPDF, title: string, subtitle: string) {
  let y = MARGIN;
  const logo = await loadPdfLogoImage();

  if (logo) {
    const logoHeight = drawPdfLogo(doc, logo, MARGIN, y, 42);
    y += logoHeight + 4;
  } else {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("MEDScript", MARGIN, y + 8);
    y += 14;
  }

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Gestão clínica", PAGE_WIDTH - MARGIN, MARGIN + 5, { align: "right" });

  y += 6;
  doc.setDrawColor(30, 41, 59);
  doc.setLineWidth(0.4);
  doc.line(MARGIN, y, PAGE_WIDTH - MARGIN, y);
  y += 10;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text(title, MARGIN, y);
  y += 7;

  return writeLines(doc, subtitle, MARGIN, y, { fontSize: 9 });
}

function drawSectionTitle(doc: jsPDF, title: string, y: number) {
  y = ensureSpace(doc, y, LINE_HEIGHT * 2);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(title, MARGIN, y);
  y += 4;
  doc.setDrawColor(226, 232, 240);
  doc.line(MARGIN, y, PAGE_WIDTH - MARGIN, y);
  return y + 8;
}

export async function downloadFichaCadastralPdf(bundle: PatientDocumentBundle) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const { patient, episodes } = bundle;

  let y = await drawHeader(
    doc,
    "Ficha cadastral",
    `${patient.full_name} · CPF ${formatCpf(patient.cpf)} · Gerado em ${formatDateTime(new Date().toISOString())}`
  );

  y = drawSectionTitle(doc, "Identificação", y);
  y = writeField(doc, "Nome completo", patient.full_name, y);
  y = writeField(doc, "CPF", formatCpf(patient.cpf), y);
  y = writeField(doc, "Data de nascimento", formatDate(patient.birth_date), y);
  y = writeField(doc, "Idade", patientAgeLabel(patient), y);
  y = writeField(doc, "Sexo", patientSexLabel(patient.sex), y);
  y = writeField(
    doc,
    "Situação cadastral",
    patient.is_archived ? "Arquivado" : "Ativo",
    y
  );

  episodes.forEach((episode) => {
    y = drawSectionTitle(
      doc,
      `Ficha #${episode.episode_number} · ${episodeStatusLabel(episode.status)}`,
      y + 4
    );
    y = writeLines(
      doc,
      `Aberta em ${formatDate(episode.created_at)}${
        episode.archived_at
          ? ` · Arquivada em ${formatDate(episode.archived_at)}`
          : ""
      }`,
      MARGIN,
      y,
      { fontSize: 9 }
    );
    y = writeField(doc, "Peso", displayValue(episode.weight), y);
    y = writeField(doc, "Leito", displayValue(episode.bed), y);
    y = writeField(doc, "Classificação de risco", episodeRiskLabel(episode.risk_level), y);
    y = writeField(doc, "Status", episodeStatusLabel(episode.status), y);
    y = writeField(
      doc,
      "Diagnóstico / motivo de internação",
      displayValue(episode.diagnosis),
      y
    );
    y = writeField(doc, "Alergias", displayValue(episode.allergies), y);
    y = writeField(
      doc,
      "Medicações de uso domiciliar",
      displayValue(episode.medications),
      y
    );

    y = drawSectionTitle(doc, "Tempos no Kanban", y + 2);
    buildStatusTimesSummary(episode).forEach((line) => {
      y = writeLines(doc, `• ${line}`, MARGIN, y, { fontSize: 9 });
    });

    y = drawSectionTitle(doc, "Resumo do paciente", y + 2);
    buildCareSummaryExportLines(episode.care_items ?? []).forEach((line) => {
      y = writeLines(doc, `• ${line}`, MARGIN, y, { fontSize: 9 });
    });

    const movements = (episode.patient_movements ?? []).sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    if (movements.length > 0) {
      y = drawSectionTitle(doc, "Movimentações registradas", y + 2);
      movements.forEach((movement) => {
        y = writeLines(doc, `• ${formatMovementLine(movement)}`, MARGIN, y, {
          fontSize: 9,
        });
      });
    }
  });

  y = ensureSpace(doc, y + 8, LINE_HEIGHT);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text("Documento gerado pelo MEDScript.", MARGIN, y);

  doc.save(`ficha-cadastral-${sanitizeFilename(patient.full_name)}.pdf`);
}

export async function downloadAssessmentsPdf(bundle: PatientDocumentBundle) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const { patient, episodes } = bundle;

  let y = await drawHeader(
    doc,
    "Avaliações clínicas",
    `${patient.full_name} · CPF ${formatCpf(patient.cpf)} · Gerado em ${formatDateTime(new Date().toISOString())}`
  );

  let hasContent = false;

  episodes.forEach((episode) => {
    const entries = collectAssessmentEntries(episode);
    if (entries.length === 0) return;

    hasContent = true;
    y = drawSectionTitle(
      doc,
      `Ficha #${episode.episode_number} · ${episodeStatusLabel(episode.status)}`,
      y + 4
    );

    entries.forEach((entry) => {
      y = ensureSpace(doc, y, LINE_HEIGHT * 3);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text(entry.label, MARGIN, y);
      y += LINE_HEIGHT;
      y = writeLines(doc, entry.date, MARGIN, y, { fontSize: 9 });
      y = writeLines(doc, entry.content, MARGIN, y, { fontSize: 10 });
      y += 3;
    });
  });

  if (!hasContent) {
    y = writeLines(doc, "Nenhuma avaliação registrada para este paciente.", MARGIN, y);
  }

  y = ensureSpace(doc, y + 8, LINE_HEIGHT);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text("Documento gerado pelo MEDScript.", MARGIN, y);

  doc.save(`avaliacoes-${sanitizeFilename(patient.full_name)}.pdf`);
}

export function printHtmlDocument(html: string, title: string) {
  const printWindow = window.open("", "_blank", "noopener,noreferrer,width=900,height=700");
  if (!printWindow) {
    throw new Error("Não foi possível abrir a janela de impressão. Verifique o bloqueador de pop-ups.");
  }

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.document.title = title;

  printWindow.onload = () => {
    printWindow.focus();
    printWindow.print();
  };
}

export async function printFichaCadastral(bundle: PatientDocumentBundle) {
  const { buildFichaCadastralHtml } = await import("./build-html");
  printHtmlDocument(
    buildFichaCadastralHtml(bundle),
    `Ficha cadastral — ${bundle.patient.full_name}`
  );
}

export async function printAssessments(bundle: PatientDocumentBundle) {
  const { buildAssessmentsHtml } = await import("./build-html");
  printHtmlDocument(
    buildAssessmentsHtml(bundle),
    `Avaliações — ${bundle.patient.full_name}`
  );
}

export async function fetchPatientDocuments(patientId: string, episodeId?: string) {
  const params = new URLSearchParams();
  if (episodeId) params.set("episode_id", episodeId);

  const query = params.toString();
  const res = await fetch(
    `/api/pacientes/${patientId}/documentos${query ? `?${query}` : ""}`
  );
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error ?? "Erro ao carregar documentos do paciente.");
  }

  return data as PatientDocumentBundle;
}
