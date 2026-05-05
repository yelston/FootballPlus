-- Create houses table
CREATE TABLE IF NOT EXISTS public.houses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

ALTER TABLE public.houses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated users can view houses"
  ON public.houses FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage houses"
  ON public.houses FOR ALL
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- Add houseId FK to players (nulls out on house delete)
ALTER TABLE public.players
  ADD COLUMN IF NOT EXISTS "houseId" UUID REFERENCES public.houses(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_players_house_id ON public.players("houseId");
