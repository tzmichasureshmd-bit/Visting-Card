export interface CardRow {
  id: string;
  username: string;
  full_name: string;
  designation: string | null;
  company: string | null;
  status: string;
  view_count: number;
  lead_count: number;
  updated_at: string;
  created_at: string;
  photo_url: string | null;
  cover_url: string | null;
  theme_accent: string | null;
}
