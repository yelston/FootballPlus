-- Group 1: Basic Info
ALTER TABLE public.players
  ADD COLUMN IF NOT EXISTS "dateJoined" DATE,
  ADD COLUMN IF NOT EXISTS "reviewDate" DATE;

-- Group 2: Technical scores (1–5)
ALTER TABLE public.players
  ADD COLUMN IF NOT EXISTS "technicalSprint" SMALLINT,
  ADD COLUMN IF NOT EXISTS "technicalDribbling" SMALLINT,
  ADD COLUMN IF NOT EXISTS "technicalPassing" SMALLINT,
  ADD COLUMN IF NOT EXISTS "technicalJuggling" SMALLINT,
  ADD COLUMN IF NOT EXISTS "technicalYoyo" SMALLINT;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='players' AND column_name='avgTechnicalScore') THEN
    ALTER TABLE public.players ADD COLUMN "avgTechnicalScore" NUMERIC(3,2) GENERATED ALWAYS AS (
      ROUND(
        (COALESCE("technicalSprint"::numeric, 0) + COALESCE("technicalDribbling"::numeric, 0) + COALESCE("technicalPassing"::numeric, 0) + COALESCE("technicalJuggling"::numeric, 0) + COALESCE("technicalYoyo"::numeric, 0))
        / NULLIF(
            (CASE WHEN "technicalSprint" IS NOT NULL THEN 1 ELSE 0 END +
             CASE WHEN "technicalDribbling" IS NOT NULL THEN 1 ELSE 0 END +
             CASE WHEN "technicalPassing" IS NOT NULL THEN 1 ELSE 0 END +
             CASE WHEN "technicalJuggling" IS NOT NULL THEN 1 ELSE 0 END +
             CASE WHEN "technicalYoyo" IS NOT NULL THEN 1 ELSE 0 END)::numeric,
            0
          ),
        2
      )
    ) STORED;
  END IF;
END $$;

-- Group 3: Behaviour scores (1–5)
ALTER TABLE public.players
  ADD COLUMN IF NOT EXISTS "behaviourTeamwork" SMALLINT,
  ADD COLUMN IF NOT EXISTS "behaviourAttitude" SMALLINT,
  ADD COLUMN IF NOT EXISTS "behaviourCommunication" SMALLINT;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='players' AND column_name='avgBehaviourScore') THEN
    ALTER TABLE public.players ADD COLUMN "avgBehaviourScore" NUMERIC(3,2) GENERATED ALWAYS AS (
      ROUND(
        (COALESCE("behaviourTeamwork"::numeric, 0) + COALESCE("behaviourAttitude"::numeric, 0) + COALESCE("behaviourCommunication"::numeric, 0))
        / NULLIF(
            (CASE WHEN "behaviourTeamwork" IS NOT NULL THEN 1 ELSE 0 END +
             CASE WHEN "behaviourAttitude" IS NOT NULL THEN 1 ELSE 0 END +
             CASE WHEN "behaviourCommunication" IS NOT NULL THEN 1 ELSE 0 END)::numeric,
            0
          ),
        2
      )
    ) STORED;
  END IF;
END $$;

-- Group 4: Progress
ALTER TABLE public.players
  ADD COLUMN IF NOT EXISTS "academicSchoolConcern" TEXT,
  ADD COLUMN IF NOT EXISTS "progressedToHigherLevel" BOOLEAN,
  ADD COLUMN IF NOT EXISTS "nextStepGoal" TEXT,
  ADD COLUMN IF NOT EXISTS "completedFullSeason" BOOLEAN,
  ADD COLUMN IF NOT EXISTS "joinedSchoolRegionalTeam" BOOLEAN;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'players_academic_school_concern_check'
  ) THEN
    ALTER TABLE public.players
      ADD CONSTRAINT players_academic_school_concern_check
      CHECK ("academicSchoolConcern" IS NULL OR "academicSchoolConcern" IN ('no', 'monitor', 'yes_discuss_school'));
  END IF;
END $$;

-- Group 5: Academics (1–5)
ALTER TABLE public.players
  ADD COLUMN IF NOT EXISTS "academicBaseline" SMALLINT,
  ADD COLUMN IF NOT EXISTS "academicCurrent" SMALLINT;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='players' AND column_name='academicImprovement') THEN
    ALTER TABLE public.players ADD COLUMN "academicImprovement" SMALLINT GENERATED ALWAYS AS (
      CASE WHEN "academicBaseline" IS NOT NULL AND "academicCurrent" IS NOT NULL
      THEN "academicCurrent" - "academicBaseline"
      ELSE NULL
      END
    ) STORED;
  END IF;
END $$;

-- Group 6: Notes
ALTER TABLE public.players
  ADD COLUMN IF NOT EXISTS "significantLifeChange" TEXT;

-- Group 7: Literacy
ALTER TABLE public.players
  ADD COLUMN IF NOT EXISTS "literacyEnrolled" BOOLEAN,
  ADD COLUMN IF NOT EXISTS "literacyReadingBaseline" SMALLINT,
  ADD COLUMN IF NOT EXISTS "literacyReadingCurrent" SMALLINT,
  ADD COLUMN IF NOT EXISTS "literacySessionsAttended" INTEGER;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='players' AND column_name='literacyReadingImprovement') THEN
    ALTER TABLE public.players ADD COLUMN "literacyReadingImprovement" SMALLINT GENERATED ALWAYS AS (
      CASE WHEN "literacyReadingBaseline" IS NOT NULL AND "literacyReadingCurrent" IS NOT NULL
      THEN "literacyReadingCurrent" - "literacyReadingBaseline"
      ELSE NULL
      END
    ) STORED;
  END IF;
END $$;

-- Score range constraints (1–5)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'players_technical_scores_check') THEN
    ALTER TABLE public.players ADD CONSTRAINT players_technical_scores_check CHECK (
      ("technicalSprint" IS NULL OR ("technicalSprint" >= 1 AND "technicalSprint" <= 5)) AND
      ("technicalDribbling" IS NULL OR ("technicalDribbling" >= 1 AND "technicalDribbling" <= 5)) AND
      ("technicalPassing" IS NULL OR ("technicalPassing" >= 1 AND "technicalPassing" <= 5)) AND
      ("technicalJuggling" IS NULL OR ("technicalJuggling" >= 1 AND "technicalJuggling" <= 5)) AND
      ("technicalYoyo" IS NULL OR ("technicalYoyo" >= 1 AND "technicalYoyo" <= 5))
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'players_behaviour_scores_check') THEN
    ALTER TABLE public.players ADD CONSTRAINT players_behaviour_scores_check CHECK (
      ("behaviourTeamwork" IS NULL OR ("behaviourTeamwork" >= 1 AND "behaviourTeamwork" <= 5)) AND
      ("behaviourAttitude" IS NULL OR ("behaviourAttitude" >= 1 AND "behaviourAttitude" <= 5)) AND
      ("behaviourCommunication" IS NULL OR ("behaviourCommunication" >= 1 AND "behaviourCommunication" <= 5))
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'players_academic_scores_check') THEN
    ALTER TABLE public.players ADD CONSTRAINT players_academic_scores_check CHECK (
      ("academicBaseline" IS NULL OR ("academicBaseline" >= 1 AND "academicBaseline" <= 5)) AND
      ("academicCurrent" IS NULL OR ("academicCurrent" >= 1 AND "academicCurrent" <= 5))
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'players_literacy_scores_check') THEN
    ALTER TABLE public.players ADD CONSTRAINT players_literacy_scores_check CHECK (
      ("literacyReadingBaseline" IS NULL OR ("literacyReadingBaseline" >= 1 AND "literacyReadingBaseline" <= 5)) AND
      ("literacyReadingCurrent" IS NULL OR ("literacyReadingCurrent" >= 1 AND "literacyReadingCurrent" <= 5))
    );
  END IF;
END $$;
