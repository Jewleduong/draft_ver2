/*
# Lead Management Module - Initial Schema

## Summary
Creates the core tables for the SalesTrack CRM Lead Management Module.

## New Tables

### leads
Stores all lead/prospect records in the CRM pipeline.
- id: UUID primary key
- name: Lead contact full name
- company: Company/organization name
- email: Contact email address
- phone: Contact phone number
- source: How the lead was acquired (Website, LinkedIn, Referral, Event, Cold Outreach)
- status: Current lead status (New, Contacted, Qualified, Converted, Rejected)
- estimated_value: Estimated deal value in USD
- owner_name: Name of assigned sales representative
- notes: Free-form notes about the lead
- created_at / updated_at: Timestamps

### lead_activities
Stores all activity log entries for each lead (calls, emails, meetings, etc.).
- id: UUID primary key
- lead_id: Foreign key to leads table
- type: Activity type (Call, Email, Meeting, WhatsApp, System Update)
- note: Activity description/notes
- logged_by: Name of the person who logged the activity
- created_at: Timestamp

### deals
Stores deals created from converted leads.
- id: UUID primary key
- lead_id: Source lead (nullable FK)
- name: Deal name
- value: Deal monetary value
- stage: Pipeline stage (Prospecting, Qualification, Proposal, Negotiation, Closed Won)
- expected_close_date: Target close date
- created_at: Timestamp

## Security
- RLS enabled on all tables
- Public anon+authenticated access (single-tenant CRM demo app, role-based access enforced in UI)
*/

-- LEADS TABLE
CREATE TABLE IF NOT EXISTS leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  company text NOT NULL,
  email text NOT NULL,
  phone text DEFAULT '',
  source text NOT NULL DEFAULT 'Website',
  status text NOT NULL DEFAULT 'New',
  estimated_value numeric(12,2) DEFAULT 0,
  owner_name text NOT NULL DEFAULT 'Unassigned',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_leads" ON leads;
CREATE POLICY "anon_select_leads" ON leads FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_leads" ON leads;
CREATE POLICY "anon_insert_leads" ON leads FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_leads" ON leads;
CREATE POLICY "anon_update_leads" ON leads FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_leads" ON leads;
CREATE POLICY "anon_delete_leads" ON leads FOR DELETE TO anon, authenticated USING (true);

-- LEAD ACTIVITIES TABLE
CREATE TABLE IF NOT EXISTS lead_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'Note',
  note text NOT NULL DEFAULT '',
  logged_by text NOT NULL DEFAULT 'System',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE lead_activities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_lead_activities" ON lead_activities;
CREATE POLICY "anon_select_lead_activities" ON lead_activities FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_lead_activities" ON lead_activities;
CREATE POLICY "anon_insert_lead_activities" ON lead_activities FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_lead_activities" ON lead_activities;
CREATE POLICY "anon_update_lead_activities" ON lead_activities FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_lead_activities" ON lead_activities;
CREATE POLICY "anon_delete_lead_activities" ON lead_activities FOR DELETE TO anon, authenticated USING (true);

-- DEALS TABLE
CREATE TABLE IF NOT EXISTS deals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES leads(id) ON DELETE SET NULL,
  name text NOT NULL,
  value numeric(12,2) DEFAULT 0,
  stage text NOT NULL DEFAULT 'Prospecting',
  expected_close_date date,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE deals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_deals" ON deals;
CREATE POLICY "anon_select_deals" ON deals FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_deals" ON deals;
CREATE POLICY "anon_insert_deals" ON deals FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_deals" ON deals;
CREATE POLICY "anon_update_deals" ON deals FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_deals" ON deals;
CREATE POLICY "anon_delete_deals" ON deals FOR DELETE TO anon, authenticated USING (true);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS leads_updated_at ON leads;
CREATE TRIGGER leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Indexes
CREATE INDEX IF NOT EXISTS leads_status_idx ON leads(status);
CREATE INDEX IF NOT EXISTS leads_owner_idx ON leads(owner_name);
CREATE INDEX IF NOT EXISTS leads_updated_at_idx ON leads(updated_at DESC);
CREATE INDEX IF NOT EXISTS lead_activities_lead_id_idx ON lead_activities(lead_id);
CREATE INDEX IF NOT EXISTS lead_activities_created_at_idx ON lead_activities(created_at DESC);
