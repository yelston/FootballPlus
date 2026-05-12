CREATE TABLE programme_metrics (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  programme text NOT NULL,
  metric_key text NOT NULL,
  annual_target text,
  q1_actual text,
  q2_actual text,
  q3_actual text,
  q4_actual text,
  ytd_total text,
  status text,
  notes text,
  updated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(programme, metric_key)
);

ALTER TABLE programme_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all" ON programme_metrics FOR ALL TO authenticated
  USING ((SELECT role FROM users WHERE id = auth.uid()) = 'admin')
  WITH CHECK ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');

CREATE POLICY "board_read" ON programme_metrics FOR SELECT TO authenticated
  USING ((SELECT role FROM users WHERE id = auth.uid()) = 'board');
