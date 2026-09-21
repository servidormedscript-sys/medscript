/** Deep link para calculadora de gotejamento a partir de protocolos clínicos */
export function hrefGotejamento(opts?: { preset?: string; dose?: number; weightKg?: number }) {
  const q = new URLSearchParams({
    category: "ferramentas",
    protocol: "calculadora-gotejamento",
  });
  if (opts?.preset) q.set("preset", opts.preset);
  if (opts?.dose != null) q.set("dose", String(opts.dose));
  if (opts?.weightKg != null) q.set("weight", String(opts.weightKg));
  return `/dashboard/protocolos-clinicos?${q.toString()}`;
}
