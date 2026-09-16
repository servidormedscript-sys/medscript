import { getLogoUrl } from "@/lib/patient-documents/formatters";
import type { jsPDF } from "jspdf";

export type PdfLogoImage = {
  dataUrl: string;
  format: "JPEG";
  aspectRatio: number;
};

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

export async function loadPdfLogoImage(logoUrl?: string): Promise<PdfLogoImage | null> {
  const url = logoUrl ?? getLogoUrl();

  try {
    const response = await fetch(url);
    if (!response.ok) return null;

    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);

    try {
      const image = await loadImage(objectUrl);
      const canvas = document.createElement("canvas");
      const maxWidth = 900;
      const scale = Math.min(1, maxWidth / image.naturalWidth);
      const width = Math.max(1, Math.round(image.naturalWidth * scale));
      const height = Math.max(1, Math.round(image.naturalHeight * scale));

      canvas.width = width;
      canvas.height = height;

      const context = canvas.getContext("2d");
      if (!context) return null;

      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, width, height);
      context.drawImage(image, 0, 0, width, height);

      return {
        dataUrl: canvas.toDataURL("image/jpeg", 0.94),
        format: "JPEG",
        aspectRatio: width / height,
      };
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  } catch {
    return null;
  }
}

export function drawPdfLogo(
  doc: jsPDF,
  logo: PdfLogoImage,
  x: number,
  y: number,
  widthMm: number,
) {
  const heightMm = widthMm / logo.aspectRatio;
  doc.addImage(logo.dataUrl, logo.format, x, y, widthMm, heightMm);
  return heightMm;
}
