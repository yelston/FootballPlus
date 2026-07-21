-- Add explicit attendance outcomes while preserving existing rows as attended.
ALTER TABLE public.attendance
  ADD COLUMN IF NOT EXISTS status TEXT,
  ADD COLUMN IF NOT EXISTS reason TEXT;

UPDATE public.attendance
SET status = 'attended'
WHERE status IS NULL;

ALTER TABLE public.attendance
  ALTER COLUMN status SET DEFAULT 'attended',
  ALTER COLUMN status SET NOT NULL;

ALTER TABLE public.attendance
  DROP CONSTRAINT IF EXISTS attendance_status_check,
  ADD CONSTRAINT attendance_status_check CHECK (status IN ('attended', 'excused', 'absent'));

UPDATE public.attendance
SET points = 0
WHERE status IN ('excused', 'absent');
