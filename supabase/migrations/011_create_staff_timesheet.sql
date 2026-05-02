CREATE TABLE IF NOT EXISTS public.staff_timesheet (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date                  DATE NOT NULL,
  "weekCommencing"      DATE NOT NULL,
  "userId"              UUID REFERENCES public.users(id) ON DELETE SET NULL,
  role                  TEXT,
  program               TEXT,
  "fundingSource"       TEXT,
  "activityType"        TEXT,
  hours                 NUMERIC(4,1) NOT NULL,
  "hourlyCost"          NUMERIC(10,2),
  "allocatedLabourCost" NUMERIC(10,2),
  quarter               TEXT,
  month                 TEXT,
  notes                 TEXT,
  approved              BOOLEAN DEFAULT FALSE,
  "createdAt"           TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  "updatedAt"           TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

ALTER TABLE public.staff_timesheet ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can do everything on staff_timesheet"
  ON public.staff_timesheet
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "All authenticated users can read staff_timesheet"
  ON public.staff_timesheet
  FOR SELECT
  TO authenticated
  USING (true);
