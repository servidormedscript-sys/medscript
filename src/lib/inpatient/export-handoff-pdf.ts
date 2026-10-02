import { jsPDF } from "jspdf";

export function downloadHandoffPdf(text: string, filename = "passagem-plantao.pdf") {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const margin = 14;
  const pageWidth = doc.internal.pageSize.getWidth();
  const maxWidth = pageWidth - margin * 2;
  const lines = doc.splitTextToSize(text, maxWidth);
  let y = margin;
  const lineHeight = 5;

  for (const line of lines) {
    if (y > doc.internal.pageSize.getHeight() - margin) {
      doc.addPage();
      y = margin;
    }
    doc.setFontSize(10);
    doc.text(line, margin, y);
    y += lineHeight;
  }

  doc.save(filename);
}
