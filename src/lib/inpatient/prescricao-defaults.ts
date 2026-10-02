import { GENERAL_ORDER_ITEMS } from "@/lib/inpatient/general-orders";

export function DEFAULT_GENERAL_ORDERS(episodeId: string) {
  const order_flags: Record<string, boolean> = {};
  for (const item of GENERAL_ORDER_ITEMS) {
    order_flags[item.id] = false;
  }
  return {
    episode_id: episodeId,
    order_flags,
    diet: "dieta_oral_geral",
    vitals_frequency: "6_6h",
    padua_score: {},
    caprini_score: {},
  };
}
