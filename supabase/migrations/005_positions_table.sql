-- Create positions table (reference data for player positions)
CREATE TABLE IF NOT EXISTS public.positions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  "sortOrder" INTEGER DEFAULT 0,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.positions ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view positions
CREATE POLICY "All authenticated users can view positions"
  ON public.positions
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Admins and coaches can manage positions
CREATE POLICY "Admins and coaches can manage positions"
  ON public.positions
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

-- Seed with current SOCCER_POSITIONS (matches existing player.positions values)
INSERT INTO public.positions (name, "sortOrder") VALUES
  ('Goalkeeper', 1),
  ('Defender', 2),
  ('Midfielder', 3),
  ('Forward', 4),
  ('Left Back', 5),
  ('Right Back', 6),
  ('Center Back', 7),
  ('Left Midfielder', 8),
  ('Right Midfielder', 9),
  ('Center Midfielder', 10),
  ('Striker', 11),
  ('Winger', 12)
ON CONFLICT (name) DO NOTHING;
