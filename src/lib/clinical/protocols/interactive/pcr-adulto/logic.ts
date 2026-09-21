import type { RitmoAdulto } from "./reversible-causes";

export const RHYTHM_CHECK_INTERVAL_SEC = 120;
export const VIABILITY_FIRST_SEC = 3600;
export const VIABILITY_REPEAT_SEC = 1200;
export const COMPRESSION_RESET_MS = 3000;
export const COMPRESSION_WINDOW = 12;
export const COMPRESSION_MIN_TAPS = 4;

export function ritmoChocavel(ritmo: RitmoAdulto | null): boolean {
  return ritmo === "fv" || ritmo === "tvsp";
}

export function compressionBpm(timestampsMs: number[]): {
  bpm: number | null;
  status: "idle" | "slow" | "ok" | "fast";
} {
  if (timestampsMs.length < COMPRESSION_MIN_TAPS) {
    return { bpm: null, status: "idle" };
  }
  const recent = timestampsMs.slice(-COMPRESSION_WINDOW);
  const intervals: number[] = [];
  for (let i = 1; i < recent.length; i += 1) {
    intervals.push(recent[i] - recent[i - 1]);
  }
  const avgMs = intervals.reduce((a, b) => a + b, 0) / intervals.length;
  const bpm = Math.round(60000 / avgMs);
  if (bpm < 100) return { bpm, status: "slow" };
  if (bpm > 120) return { bpm, status: "fast" };
  return { bpm, status: "ok" };
}

export function registerCompressionTap(timestampsMs: number[], nowMs: number): number[] {
  const last = timestampsMs[timestampsMs.length - 1];
  if (last !== undefined && nowMs - last > COMPRESSION_RESET_MS) {
    return [nowMs];
  }
  const next = [...timestampsMs, nowMs];
  if (next.length > COMPRESSION_WINDOW) {
    return next.slice(-COMPRESSION_WINDOW);
  }
  return next;
}

export function amiodaronaDoseMg(doseIndex: number): number {
  return doseIndex === 0 ? 300 : 150;
}

export function shouldShowViabilidadeAlert(
  elapsedSec: number,
  lastAcknowledgedAtSec: number
): boolean {
  if (elapsedSec < VIABILITY_FIRST_SEC) return false;
  if (lastAcknowledgedAtSec === 0 && elapsedSec >= VIABILITY_FIRST_SEC) return true;
  return elapsedSec - lastAcknowledgedAtSec >= VIABILITY_REPEAT_SEC;
}

export function shouldShowRhythmCheckAlert(
  elapsedSec: number,
  lastRhythmAckSec: number
): boolean {
  if (elapsedSec < RHYTHM_CHECK_INTERVAL_SEC) return false;
  return elapsedSec - lastRhythmAckSec >= RHYTHM_CHECK_INTERVAL_SEC;
}

export type PcrAdultoUiFlags = {
  showMedsAndCauses: boolean;
  showAmiodarona: boolean;
  shockEnabled: boolean;
  amiodaronaBlocked: boolean;
  amiodaronaCeilingWarn: boolean;
};

export function getUiFlags(
  ritmo: RitmoAdulto | null,
  ritmoChecado: boolean,
  choqueDisponivel: boolean
): PcrAdultoUiFlags {
  const chocavel = ritmoChocavel(ritmo);
  return {
    showMedsAndCauses: ritmoChecado,
    showAmiodarona: ritmoChecado && chocavel,
    shockEnabled: ritmoChecado && chocavel && choqueDisponivel,
    amiodaronaBlocked: !chocavel,
    amiodaronaCeilingWarn: false,
  };
}
