-- Add autopilot_enabled column to openclaw_dossier
ALTER TABLE public.openclaw_dossier
  ADD COLUMN IF NOT EXISTS autopilot_enabled BOOLEAN NOT NULL DEFAULT false;

-- Index for fast cron queries on auto-pilot users
CREATE INDEX IF NOT EXISTS idx_openclaw_dossier_autopilot
  ON public.openclaw_dossier (user_id)
  WHERE autopilot_enabled = true;