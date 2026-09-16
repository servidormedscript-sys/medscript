import { formatCpf } from "@/lib/utils/cpf";
import type { PatientDocumentBundle } from "./types";
import {
  collectAssessmentEntries,
  displayValue,
  formatDate,
  formatDateTime,
  formatMovementLine,
  getLogoUrl,
  patientAgeLabel,
  patientSexLabel,
  episodeRiskLabel,
  episodeStatusLabel,
} from "./formatters";
import { buildStatusTimesSummary } from "@/lib/patient-status-time";
import { buildCareSummaryExportLines } from "@/lib/patient-care-summary";

function documentStyles() {
  return `
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 32px;
      color: #243456;
      font-family: Arial, Helvetica, sans-serif;
      font-size: 12px;
      line-height: 1.5;
      background: #FFFFFF;
    }
    .header {
      display: flex;
      align-items: center;
      gap: 16px;
      border-bottom: 2px solid #255A7C;
      padding-bottom: 16px;
      margin-bottom: 24px;
    }
    .logo { height: 42px; width: auto; object-fit: contain; }
    .brand { font-size: 20px; font-weight: 700; color: #243456; }
    .subtitle { font-size: 11px; color: #327599; margin-top: 2px; }
    h1 { font-size: 18px; margin: 0 0 6px; color: #243456; }
    h2 {
      font-size: 13px;
      margin: 24px 0 10px;
      padding-bottom: 6px;
      border-bottom: 1px solid #E4E9F0;
      color: #255A7C;
    }
    .meta { color: #476690; font-size: 11px; margin-bottom: 18px; }
    .grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 12px 24px;
    }
    .field label {
      display: block;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: #476690;
      margin-bottom: 2px;
    }
    .field p {
      margin: 0;
      white-space: pre-wrap;
      word-break: break-word;
    }
    .full { grid-column: 1 / -1; }
    .episode-card {
      border: 1px solid #E4E9F0;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 16px;
      page-break-inside: avoid;
    }
    .assessment {
      border: 1px solid #E4E9F0;
      border-radius: 8px;
      padding: 14px;
      margin-bottom: 12px;
      page-break-inside: avoid;
    }
    .assessment h3 { margin: 0 0 4px; font-size: 12px; }
    .assessment .date { color: #476690; font-size: 10px; margin-bottom: 8px; }
    .assessment pre {
      margin: 0;
      white-space: pre-wrap;
      font-family: inherit;
      font-size: 11px;
    }
    .movements {
      margin: 10px 0 0;
      padding-left: 18px;
    }
    .footer {
      margin-top: 28px;
      padding-top: 12px;
      border-top: 1px solid #E4E9F0;
      font-size: 10px;
      color: #476690;
    }
    @media print {
      body { padding: 16px; }
    }
  `;
}

function headerBlock(title: string, subtitle: string) {
  return `
    <div class="header">
      <img src="${getLogoUrl()}" alt="MEDScript" class="logo" />
      <div>
        <div class="brand">MEDScript</div>
        <div class="subtitle">Gestão clínica</div>
      </div>
    </div>
    <h1>${title}</h1>
    <p class="meta">${subtitle}</p>
  `;
}

function field(label: string, value: string, full = false) {
  return `
    <div class="field${full ? " full" : ""}">
      <label>${label}</label>
      <p>${value}</p>
    </div>
  `;
}

export function buildFichaCadastralHtml(bundle: PatientDocumentBundle) {
  const { patient, episodes } = bundle;
  const episodeSections = episodes
    .map((episode) => {
      const movements = (episode.patient_movements ?? [])
        .sort(
          (a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        )
        .map((movement) => `<li>${formatMovementLine(movement)}</li>`)
        .join("");

      return `
        <div class="episode-card">
          <h2>Ficha #${episode.episode_number} · ${episodeStatusLabel(episode.status)}</h2>
          <p class="meta">
            Aberta em ${formatDate(episode.created_at)}
            ${episode.archived_at ? ` · Arquivada em ${formatDate(episode.archived_at)}` : ""}
          </p>
          <div class="grid">
            ${field("Peso", displayValue(episode.weight))}
            ${field("Leito", displayValue(episode.bed))}
            ${field("Classificação de risco", episodeRiskLabel(episode.risk_level))}
            ${field("Status", episodeStatusLabel(episode.status))}
            ${field("Diagnóstico / motivo de internação", displayValue(episode.diagnosis), true)}
            ${field("Alergias", displayValue(episode.allergies), true)}
            ${field("Medicações de uso domiciliar", displayValue(episode.medications), true)}
          </div>
          <h2>Tempos no Kanban</h2>
          <ul class="movements">
            ${buildStatusTimesSummary(episode)
              .map((line) => `<li>${line}</li>`)
              .join("")}
          </ul>
          <h2>Resumo do paciente</h2>
          <ul class="movements">
            ${buildCareSummaryExportLines(episode.care_items ?? [])
              .map((line) => `<li>${line}</li>`)
              .join("")}
          </ul>
          ${
            movements
              ? `<h2>Movimentações registradas</h2><ul class="movements">${movements}</ul>`
              : ""
          }
        </div>
      `;
    })
    .join("");

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <title>Ficha cadastral — ${patient.full_name}</title>
  <style>${documentStyles()}</style>
</head>
<body>
  ${headerBlock(
    "Ficha cadastral",
    `${patient.full_name} · CPF ${formatCpf(patient.cpf)} · Gerado em ${formatDateTime(new Date().toISOString())}`
  )}
  <h2>Identificação</h2>
  <div class="grid">
    ${field("Nome completo", patient.full_name)}
    ${field("CPF", formatCpf(patient.cpf))}
    ${field("Data de nascimento", formatDate(patient.birth_date))}
    ${field("Idade", patientAgeLabel(patient))}
    ${field("Sexo", patientSexLabel(patient.sex))}
    ${field("Situação cadastral", patient.is_archived ? "Arquivado" : "Ativo")}
  </div>
  ${episodeSections}
  <div class="footer">Documento gerado pelo MEDScript.</div>
</body>
</html>`;
}

export function buildAssessmentsHtml(bundle: PatientDocumentBundle) {
  const { patient, episodes } = bundle;

  const sections = episodes
    .map((episode) => {
      const entries = collectAssessmentEntries(episode);
      if (entries.length === 0) return "";

      const assessmentsHtml = entries
        .map(
          (entry) => `
          <div class="assessment">
            <h3>${entry.label}</h3>
            <div class="date">${entry.date}</div>
            <pre>${entry.content}</pre>
          </div>
        `
        )
        .join("");

      return `
        <div class="episode-card">
          <h2>Ficha #${episode.episode_number} · ${episodeStatusLabel(episode.status)}</h2>
          ${assessmentsHtml}
        </div>
      `;
    })
    .filter(Boolean)
    .join("");

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <title>Avaliações — ${patient.full_name}</title>
  <style>${documentStyles()}</style>
</head>
<body>
  ${headerBlock(
    "Avaliações clínicas",
    `${patient.full_name} · CPF ${formatCpf(patient.cpf)} · Gerado em ${formatDateTime(new Date().toISOString())}`
  )}
  ${sections || "<p>Nenhuma avaliação registrada para este paciente.</p>"}
  <div class="footer">Documento gerado pelo MEDScript.</div>
</body>
</html>`;
}
