-- Create junction table for many-to-many player-team membership
CREATE TABLE public.player_teams (
  "playerId" UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  "teamId"   UUID NOT NULL REFERENCES public.teams(id)   ON DELETE CASCADE,
  "joinedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  PRIMARY KEY ("playerId", "teamId")
);

-- Migrate existing single-team assignments
INSERT INTO public.player_teams ("playerId", "teamId")
SELECT id, "teamId" FROM public.players WHERE "teamId" IS NOT NULL;

-- Remove old column
ALTER TABLE public.players DROP COLUMN "teamId";

-- Indexes
CREATE INDEX idx_player_teams_player_id ON public.player_teams("playerId");
CREATE INDEX idx_player_teams_team_id   ON public.player_teams("teamId");

-- RLS
ALTER TABLE public.player_teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated users can view player_teams"
  ON public.player_teams FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admins and coaches can manage player_teams"
  ON public.player_teams FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'coach'))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'coach'))
  );
