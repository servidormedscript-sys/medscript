export type UserRole = "admin" | "member";
export type UserType = "plantonista" | "estudante";

export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  user_type: UserType | null;
  parent_admin_id: string | null;
  clinic_name: string | null;
  phone: string | null;
  bio?: string | null;
  specialty?: string | null;
  created_at: string;
  updated_at: string;
};

export type Organization = {
  id: string;
  name: string;
  description: string | null;
  admin_id: string;
  created_at: string;
  updated_at: string;
};

export type OrganizationMember = {
  id: string;
  organization_id: string;
  profile_id: string;
  created_at: string;
  profile?: Profile;
};
