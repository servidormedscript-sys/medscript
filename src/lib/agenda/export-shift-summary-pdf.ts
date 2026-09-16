import { jsPDF } from "jspdf";
import { formatShiftDate, formatShiftTime } from "@/lib/agenda/format";
import {
  formatShiftHours,
  getMonthLabel,
} from "@/lib/agenda/shift-hours";
import type { ShiftRankingResponse } from "@/lib/agenda/ranking-types";
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
  options?: { fontSize?: number; fontStyle?: "normal" | "bold" },
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

export async function downloadShiftSummaryPdf(data: ShiftRankingResponse) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const periodLabel = `${getMonthLabel(data.month)} de ${data.year}`;

  let y = await drawHeader(
    doc,
    "Resumo de plantões",
    `${data.user_name} · ${periodLabel} · Gerado em ${new Date().toLocaleString("pt-BR")}`,
  );

  y = drawSectionTitle(doc, "Totais do período", y);
  y = writeLines(
    doc,
    `Plantões realizados: ${data.my_totals.shifts}\nCarga horária total: ${formatShiftHours(data.my_totals.hours)}`,
    MARGIN,
    y,
  );
  y += 4;

  y = drawSectionTitle(doc, "Detalhamento", y);

  if (!data.my_shifts.length) {
    y = writeLines(doc, "Nenhum plantão registrado neste período.", MARGIN, y);
  } else {
    for (const shift of data.my_shifts) {
      const line = `${formatShiftDate(shift.shift_date)} · ${formatShiftTime(shift.start_time)} – ${formatShiftTime(shift.end_time)} · ${formatShiftHours(shift.hours)}${shift.notes ? ` · ${shift.notes}` : ""}`;
      y = writeLines(doc, line, MARGIN, y);
    }
  }

  doc.save(
    `resumo-plantoes-${data.year}-${String(data.month).padStart(2, "0")}.pdf`,
  );
}
