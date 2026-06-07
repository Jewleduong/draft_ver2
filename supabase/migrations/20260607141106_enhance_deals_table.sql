/*
# Enhance Deals Table for Full Pipeline Module

## Summary
Adds missing columns to the deals table to support the full Commercial Deals Pipeline module,
and creates a deal_activities table for deal-specific activity logging.

## Changes to `deals` table
- Add `company` (text) — company name for the deal
- Add `contact_person` (text) — primary contact name
- Add `contact_email` (text) — contact email address
- Add `contact_phone` (text) — contact phone
- Add `probability` (numeric) — win probability 0–100
- Add `owner_name` (text) — assigned sales rep
- Add `notes` (text) — free-form notes
- Add `updated_at` (timestamptz) — last update timestamp

## New Tables
### deal_activities
Stores activity log entries for each deal.
- id: UUID primary key
- deal_id: FK to deals
- type: Call | Email | Meeting | System Update
- note: Activity description
- logged_by: Person who logged it
- created_at: Timestamp

## Security
- RLS enabled on all new/modified tables
- Public anon+authenticated access (single-tenant demo app)
*/

-- Add missing columns to deals table
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='deals' AND column_name='company') THEN
    ALTER TABLE deals ADD COLUMN company text NOT NULL DEFAULT '';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='deals' AND column_name='contact_person') THEN
    ALTER TABLE deals ADD COLUMN contact_person text NOT NULL DEFAULT '';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='deals' AND column_name='contact_email') THEN
    ALTER TABLE deals ADD COLUMN contact_email text NOT NULL DEFAULT '';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='deals' AND column_name='contact_phone') THEN
    ALTER TABLE deals ADD COLUMN contact_phone text NOT NULL DEFAULT '';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='deals' AND column_name='probability') THEN
    ALTER TABLE deals ADD COLUMN probability numeric(5,2) NOT NULL DEFAULT 10;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='deals' AND column_name='owner_name') THEN
    ALTER TABLE deals ADD COLUMN owner_name text NOT NULL DEFAULT 'Unassigned';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='deals' AND column_name='notes') THEN
    ALTER TABLE deals ADD COLUMN notes text NOT NULL DEFAULT '';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='deals' AND column_name='updated_at') THEN
    ALTER TABLE deals ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now();
  END IF;
END $$;

-- Updated_at trigger for deals
CREATE OR REPLACE FUNCTION update_deals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS deals_updated_at ON deals;
CREATE TRIGGER deals_updated_at
  BEFORE UPDATE ON deals
  FOR EACH ROW EXECUTE FUNCTION update_deals_updated_at();

-- DEAL ACTIVITIES TABLE
CREATE TABLE IF NOT EXISTS deal_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'Note',
  note text NOT NULL DEFAULT '',
  logged_by text NOT NULL DEFAULT 'System',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE deal_activities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_deal_activities" ON deal_activities;
CREATE POLICY "anon_select_deal_activities" ON deal_activities FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_deal_activities" ON deal_activities;
CREATE POLICY "anon_insert_deal_activities" ON deal_activities FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_deal_activities" ON deal_activities;
CREATE POLICY "anon_update_deal_activities" ON deal_activities FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_deal_activities" ON deal_activities;
CREATE POLICY "anon_delete_deal_activities" ON deal_activities FOR DELETE TO anon, authenticated USING (true);

-- Indexes
CREATE INDEX IF NOT EXISTS deals_stage_idx ON deals(stage);
CREATE INDEX IF NOT EXISTS deals_owner_idx ON deals(owner_name);
CREATE INDEX IF NOT EXISTS deals_updated_at_idx ON deals(updated_at DESC);
CREATE INDEX IF NOT EXISTS deal_activities_deal_id_idx ON deal_activities(deal_id);
