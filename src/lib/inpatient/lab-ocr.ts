import { LAB_ANALYTES } from "@/lib/inpatient/lab-analytes";

export type OcrExtractedValue = {
  analyteKey: string;
  label: string;
  value: number;
  selected: boolean;
};

function parseBrazilianNumber(raw: string): number | null {
  let s = raw.trim();
  if (/^\d{1,3}(\.\d{3})+(,\d+)?$/.test(s)) {
    s = s.replace(/\./g, "").replace(",", ".");
  } else {
    s = s.replace(",", ".");
  }
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : null;
}

function numbersAfterMatch(line: string, start: number): number[] {
  const tail = line.slice(start);
  const matches = tail.match(/[\d]+(?:[.,]\d+)*/g) ?? [];
  return matches
    .map(parseBrazilianNumber)
    .filter((n): n is number => n != null);
}

export function extractLabValuesFromText(text: string): OcrExtractedValue[] {
  const lines = text.split(/\r?\n/);
  const found: OcrExtractedValue[] = [];

  for (const def of LAB_ANALYTES) {
    for (const line of lines) {
      let matched = false;
      let idx = 0;
      for (const pat of def.patterns) {
        const m = pat.exec(line);
        if (m) {
          matched = true;
          idx = m.index + m[0].length;
          break;
        }
      }
      if (!matched) continue;

      const candidates = numbersAfterMatch(line, idx);
      const value = candidates.find(
        (n) => n >= def.plausibleMin && n <= def.plausibleMax,
      );
      if (value == null) continue;

      if (!found.some((f) => f.analyteKey === def.key)) {
        found.push({
          analyteKey: def.key,
          label: def.label,
          value,
          selected: true,
        });
      }
      break;
    }
  }

  return found;
}

export function extractImagingConclusion(text: string): string | null {
  const lower = text.toLowerCase();
  const markers = ["impressão", "impressao", "conclusão", "conclusao"];
  let start = -1;
  for (const m of markers) {
    const i = lower.indexOf(m);
    if (i >= 0) {
      start = i;
      break;
    }
  }
  if (start < 0) return null;
  return text.slice(start).trim();
}

export async function extractTextFromPdfFile(file: File): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  if (typeof window !== "undefined") {
    pdfjs.GlobalWorkerOptions.workerSrc = new URL(
      "pdfjs-dist/build/pdf.worker.min.mjs",
      import.meta.url,
    ).toString();
  }
  const data = new Uint8Array(await file.arrayBuffer());
  const doc = await pdfjs.getDocument({ data }).promise;
  const parts: string[] = [];
  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const content = await page.getTextContent();
    const lineMap = new Map<number, { x: number; str: string }[]>();
    for (const item of content.items) {
      if (!("str" in item) || !item.str) continue;
      const y = Math.round((item.transform[5] as number) / 2);
      const x = item.transform[4] as number;
      const bucket = lineMap.get(y) ?? [];
      bucket.push({ x, str: item.str });
      lineMap.set(y, bucket);
    }
    const ys = [...lineMap.keys()].sort((a, b) => b - a);
    for (const y of ys) {
      const segs = (lineMap.get(y) ?? []).sort((a, b) => a.x - b.x);
      parts.push(segs.map((s) => s.str).join(" "));
    }
  }
  return parts.join("\n");
}

export async function extractTextFromImageFile(file: File): Promise<string> {
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("por");
  const {
    data: { text },
  } = await worker.recognize(file);
  await worker.terminate();
  return text;
}
