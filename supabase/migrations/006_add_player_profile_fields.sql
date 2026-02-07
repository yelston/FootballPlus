ALTER TABLE public.players
ADD COLUMN IF NOT EXISTS "preferredName" TEXT,
ADD COLUMN IF NOT EXISTS "jerseyNumber" SMALLINT,
ADD COLUMN IF NOT EXISTS "dominantFoot" TEXT,
ADD COLUMN IF NOT EXISTS "guardianName" TEXT,
ADD COLUMN IF NOT EXISTS "guardianRelationship" TEXT,
ADD COLUMN IF NOT EXISTS "guardianPhone" TEXT,
ADD COLUMN IF NOT EXISTS "guardianEmail" TEXT,
ADD COLUMN IF NOT EXISTS "emergencyContactName" TEXT,
ADD COLUMN IF NOT EXISTS "emergencyContactRelationship" TEXT,
ADD COLUMN IF NOT EXISTS "emergencyContactPhone" TEXT,
ADD COLUMN IF NOT EXISTS "medicalNotes" TEXT,
ADD COLUMN IF NOT EXISTS "injuryStatus" TEXT DEFAULT 'none',
ADD COLUMN IF NOT EXISTS "medicationNotes" TEXT,
ADD COLUMN IF NOT EXISTS "photoConsent" BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS "medicalConsent" BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS "transportConsent" BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS "strengths" TEXT,
ADD COLUMN IF NOT EXISTS "developmentFocus" TEXT,
ADD COLUMN IF NOT EXISTS "coachSummary" TEXT,
ADD COLUMN IF NOT EXISTS "registeredAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'players_dominant_foot_check'
  ) THEN
    ALTER TABLE public.players
    ADD CONSTRAINT players_dominant_foot_check
    CHECK ("dominantFoot" IS NULL OR "dominantFoot" IN ('left', 'right', 'both'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'players_injury_status_check'
  ) THEN
    ALTER TABLE public.players
    ADD CONSTRAINT players_injury_status_check
    CHECK ("injuryStatus" IN ('none', 'rehab', 'restricted', 'unavailable'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'players_jersey_number_check'
  ) THEN
    ALTER TABLE public.players
    ADD CONSTRAINT players_jersey_number_check
    CHECK ("jerseyNumber" IS NULL OR ("jerseyNumber" >= 1 AND "jerseyNumber" <= 99));
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.set_players_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_players_updated_at ON public.players;

CREATE TRIGGER set_players_updated_at
BEFORE UPDATE ON public.players
FOR EACH ROW
EXECUTE FUNCTION public.set_players_updated_at();
