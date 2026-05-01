CREATE TABLE IF NOT EXISTS public.literacy_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "playerId" UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  phonics TEXT,
  sightwords TEXT,
  readers TEXT,
  notes TEXT,
  "loggedByUserId" UUID NOT NULL REFERENCES public.users(id),
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS literacy_sessions_player_idx
  ON public.literacy_sessions("playerId", date DESC);

ALTER TABLE public.literacy_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "literacy_sessions_select" ON public.literacy_sessions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "literacy_sessions_insert" ON public.literacy_sessions
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'coach')
  ));

CREATE POLICY "literacy_sessions_update" ON public.literacy_sessions
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'coach')
  ));

CREATE POLICY "literacy_sessions_delete" ON public.literacy_sessions
  FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'coach')
  ));
