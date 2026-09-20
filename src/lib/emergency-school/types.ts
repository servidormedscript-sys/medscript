export type SchoolModuleStatus = "locked" | "available" | "in_progress" | "completed";

export type SchoolModule = {
  id: string;
  phaseId: string;
  title: string;
  description: string;
  durationLabel?: string;
  objectives: string[];
  relatedProtocolCategoryId?: string;
  relatedProtocolIds?: string[];
};

export type SchoolPhase = {
  id: string;
  order: number;
  title: string;
  subtitle: string;
  accentClass: string;
  modules: SchoolModule[];
};

export type SchoolProgressRecord = {
  module_id: string;
  status: "in_progress" | "completed";
  completed_at: string | null;
};

export type ModuleWithState = SchoolModule & {
  status: SchoolModuleStatus;
  completedAt: string | null;
};

export type PhaseWithState = Omit<SchoolPhase, "modules"> & {
  modules: ModuleWithState[];
  completedCount: number;
  totalCount: number;
};
