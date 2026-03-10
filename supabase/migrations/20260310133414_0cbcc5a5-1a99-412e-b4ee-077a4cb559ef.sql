
-- Add composite index (user_id, event_type, created_at) for actionable queries
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_type_date
  ON public.analytics_events (user_id, event_type, created_at DESC);

-- Allow authenticated users to read their OWN analytics events
DROP POLICY IF EXISTS "analytics_events_user_select" ON public.analytics_events;
CREATE POLICY "analytics_events_user_select"
  ON public.analytics_events
  FOR SELECT
  USING (auth.uid() = user_id);
