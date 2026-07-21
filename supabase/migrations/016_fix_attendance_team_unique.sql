-- The attendance dialog now records one row per player per team per date
-- (see components/attendance/AttendanceDialog.tsx upsert onConflict: 'date,playerId,teamId'),
-- but the original unique constraint only covered (date, playerId). Align the constraint
-- with the app's upsert target so ON CONFLICT resolves correctly.
DO $$
DECLARE
  old_constraint_name TEXT;
BEGIN
  SELECT conname INTO old_constraint_name
  FROM pg_constraint
  WHERE conrelid = 'public.attendance'::regclass
    AND contype = 'u'
    AND pg_get_constraintdef(oid) = 'UNIQUE (date, "playerId")';

  IF old_constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.attendance DROP CONSTRAINT %I', old_constraint_name);
  END IF;
END $$;

ALTER TABLE public.attendance
  ADD CONSTRAINT attendance_date_playerId_teamId_key UNIQUE (date, "playerId", "teamId");
