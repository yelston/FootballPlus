CREATE TABLE IF NOT EXISTS public.staff_costing (
  id                     UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "userId"               UUID REFERENCES public.users(id) ON DELETE SET NULL,
  role                   TEXT,
  "employmentType"       TEXT,
  "monthlyGrossPay"      NUMERIC(10,2),
  "employerCpfPercent"   NUMERIC(5,2),
  "otherMonthlyCost"     NUMERIC(10,2),
  "monthlyCapacityHours" NUMERIC(6,2),
  "allInMonthlyCost"     NUMERIC(10,2),
  "blendedHourlyCost"    NUMERIC(10,4),
  notes                  TEXT,
  "createdAt"            TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  "updatedAt"            TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

ALTER TABLE public.staff_costing ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can do everything on staff_costing"
  ON public.staff_costing FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "All authenticated users can read staff_costing"
  ON public.staff_costing FOR SELECT TO authenticated
  USING (true);
