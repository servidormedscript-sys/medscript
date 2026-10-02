export type OrganizationBedStatus =
  | "livre"
  | "ocupado"
  | "higienizacao"
  | "bloqueado";

export type OrganizationBed = {
  id: string;
  admin_id: string;
  code: string;
  unit: string;
  status: OrganizationBedStatus;
  episode_id: string | null;
  created_at: string;
  updated_at: string;
};

export const BED_STATUS_LABELS: Record<OrganizationBedStatus, string> = {
  livre: "Livre",
  ocupado: "Ocupado",
  higienizacao: "Em higienização",
  bloqueado: "Bloqueado / manutenção",
};
