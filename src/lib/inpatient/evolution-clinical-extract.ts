import type { EpisodeEvolution } from "@/lib/types/inpatient-chart";

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Extrai trechos livres "Evolução clínica" de evoluções assinadas (5.7 — sem resumo por IA). */
export function extractSignedClinicalNarratives(
  evolutions: EpisodeEvolution[],
): string[] {
  const signed = evolutions
    .filter((e) => e.signed_at)
    .sort(
      (a, b) =>
        new Date(a.signed_at!).getTime() - new Date(b.signed_at!).getTime(),
    );

  const lines: string[] = [];
  for (const ev of signed) {
    const plain = stripHtml(ev.content_html);
    const match = plain.match(
      /Evolução clínica:\s*(.+?)(?=(Exames:|Prescrição|Conduta|Plano sugerido|$))/i,
    );
    const chunk = match?.[1]?.trim() ?? "";
    if (!chunk || /^\[descrever/i.test(chunk)) continue;
    const when = new Date(ev.signed_at!).toLocaleString("pt-BR");
    lines.push(`${when}: ${chunk}`);
  }
  return lines;
}
