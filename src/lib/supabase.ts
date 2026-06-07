import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type LeadStatus = 'New' | 'Contacted' | 'Qualified' | 'Converted' | 'Rejected';
export type LeadSource = 'Website' | 'LinkedIn' | 'Referral' | 'Event' | 'Cold Outreach';
export type ActivityType = 'Call' | 'Email' | 'Meeting' | 'WhatsApp' | 'System Update';

export interface Lead {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  source: LeadSource;
  status: LeadStatus;
  estimated_value: number;
  owner_name: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface LeadActivity {
  id: string;
  lead_id: string;
  type: ActivityType;
  note: string;
  logged_by: string;
  created_at: string;
}

export interface Deal {
  id: string;
  lead_id: string | null;
  name: string;
  value: number;
  stage: string;
  expected_close_date: string | null;
  created_at: string;
}
