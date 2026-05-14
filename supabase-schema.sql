-- Run this in the Supabase SQL editor to create all tables and RLS policies

CREATE TABLE tournaments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE legs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
  leg_number INTEGER NOT NULL,
  name TEXT
);

CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  leg_id UUID REFERENCES legs(id) ON DELETE CASCADE,
  home_team_id UUID REFERENCES teams(id),
  away_team_id UUID REFERENCES teams(id),
  home_score INTEGER,
  away_score INTEGER,
  scheduled_at TIMESTAMPTZ,
  round_number INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'scheduled'
);

-- Enable RLS
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE legs ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

-- Public read access (anyone with the link can see all data)
CREATE POLICY "Public read tournaments" ON tournaments FOR SELECT USING (true);
CREATE POLICY "Public read teams" ON teams FOR SELECT USING (true);
CREATE POLICY "Public read legs" ON legs FOR SELECT USING (true);
CREATE POLICY "Public read matches" ON matches FOR SELECT USING (true);

-- Authenticated write access (only admin can modify)
CREATE POLICY "Auth insert tournaments" ON tournaments FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update tournaments" ON tournaments FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth delete tournaments" ON tournaments FOR DELETE TO authenticated USING (true);

CREATE POLICY "Auth insert teams" ON teams FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update teams" ON teams FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth delete teams" ON teams FOR DELETE TO authenticated USING (true);

CREATE POLICY "Auth insert legs" ON legs FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update legs" ON legs FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth delete legs" ON legs FOR DELETE TO authenticated USING (true);

CREATE POLICY "Auth insert matches" ON matches FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update matches" ON matches FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth delete matches" ON matches FOR DELETE TO authenticated USING (true);
