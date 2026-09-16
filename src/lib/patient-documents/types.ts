import type { ClinicalAssessmentRecord } from "@/lib/types/clinical-assessment";
import type { PatientCareItem } from "@/lib/types/patient-care";
import type { EpisodeCareSummary } from "@/lib/patient-care-summary";
import type { Patient, PatientEpisode, PatientMovement } from "@/lib/types/patient";

export type EpisodeDocument = PatientEpisode & {
  patient_movements?: PatientMovement[];
  assessments: ClinicalAssessmentRecord[];
  care_items?: PatientCareItem[];
};
export type PatientDocumentBundle = {
  patient: Patient;
  episodes: EpisodeDocument[];
};
