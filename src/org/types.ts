export interface Organisation {
  id: string;
  created_at: string;
  name: string;
  created_by: string | null;
}

export interface Home {
  id: string;
  created_at: string;
  organisation_id: string;
  name: string;
  ofsted_urn: string | null;
}

export interface Membership {
  id: string;
  created_at: string;
  organisation_id: string;
  profile_id: string;
  role: string;
}
