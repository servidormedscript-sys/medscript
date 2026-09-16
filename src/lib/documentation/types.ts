export type DocumentationFile = {
  id: string;
  card_id: string;
  file_name: string;
  storage_path: string;
  file_size: number;
  mime_type: string | null;
  created_at: string;
};

export type DocumentationCard = {
  id: string;
  admin_id: string;
  title: string;
  description: string;
  is_protected: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  documentation_files?: DocumentationFile[];
};

export type DocumentationCardPublic = Omit<DocumentationCard, "documentation_files"> & {
  file_count: number;
  documentation_files?: DocumentationFile[];
};
