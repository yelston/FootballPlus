ALTER TABLE public.players
  ADD COLUMN IF NOT EXISTS "sitgPreSurveyScore"     SMALLINT CHECK ("sitgPreSurveyScore" BETWEEN 1 AND 65),
  ADD COLUMN IF NOT EXISTS "sitgPostSurveyScore"    SMALLINT CHECK ("sitgPostSurveyScore" BETWEEN 1 AND 65),
  ADD COLUMN IF NOT EXISTS "sitgSatisfactionRating" SMALLINT CHECK ("sitgSatisfactionRating" BETWEEN 1 AND 5);
