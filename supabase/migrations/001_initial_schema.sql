-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  "contactNumber" TEXT,
  role TEXT NOT NULL CHECK (role IN ('admin', 'coach', 'volunteer')),
  "profileImageUrl" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create teams table
CREATE TABLE IF NOT EXISTS public.teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  "mainCoachId" UUID REFERENCES public.users(id) ON DELETE SET NULL,
  "coachIds" UUID[] DEFAULT '{}',
  "volunteerIds" UUID[] DEFAULT '{}',
  notes TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create players table
CREATE TABLE IF NOT EXISTS public.players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "firstName" TEXT NOT NULL,
  "lastName" TEXT NOT NULL,
  dob DATE NOT NULL,
  positions TEXT[] DEFAULT '{}',
  "teamId" UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  "profileImageUrl" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create attendance table
CREATE TABLE IF NOT EXISTS public.attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL,
  "playerId" UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  "teamId" UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  points INTEGER DEFAULT 1 NOT NULL,
  "updatedByUserId" UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(date, "playerId")
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
-- Admins can do everything
CREATE POLICY "Admins can manage all users"
  ON public.users
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Users can read their own record
CREATE POLICY "Users can read own record"
  ON public.users
  FOR SELECT
  USING (id = auth.uid());

-- Users can update their own profile fields
CREATE POLICY "Users can update own profile"
  ON public.users
  FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid() AND
    -- Prevent role changes
    role = (SELECT role FROM public.users WHERE id = auth.uid())
  );

-- RLS Policies for teams table
-- Admins and coaches can create and update teams
CREATE POLICY "Admins and coaches can manage teams"
  ON public.teams
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('admin', 'coach')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('admin', 'coach')
    )
  );

-- All authenticated users can view teams
CREATE POLICY "All authenticated users can view teams"
  ON public.teams
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- RLS Policies for players table
-- Admins and coaches can manage players
CREATE POLICY "Admins and coaches can manage players"
  ON public.players
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('admin', 'coach')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('admin', 'coach')
    )
  );

-- All authenticated users can view players
CREATE POLICY "All authenticated users can view players"
  ON public.players
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- RLS Policies for attendance table
-- Admins and coaches can manage attendance
CREATE POLICY "Admins and coaches can manage attendance"
  ON public.attendance
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('admin', 'coach')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('admin', 'coach')
    )
  );

-- All authenticated users can view attendance
CREATE POLICY "All authenticated users can view attendance"
  ON public.attendance
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_players_team_id ON public.players("teamId");
CREATE INDEX IF NOT EXISTS idx_attendance_player_id ON public.attendance("playerId");
CREATE INDEX IF NOT EXISTS idx_attendance_date ON public.attendance(date);
CREATE INDEX IF NOT EXISTS idx_attendance_team_id ON public.attendance("teamId");
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
