
-- ═══════════════════════════════════════════════════════════════
-- openclaw_channel_deliveries
-- Real delivery receipts for every channel action dispatched
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.openclaw_channel_deliveries (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL,
  channel_action_id     UUID NOT NULL REFERENCES public.openclaw_channel_actions(id) ON DELETE CASCADE,
  channel               TEXT NOT NULL,
  dispatch_status       TEXT NOT NULL DEFAULT 'prepared',
  provider_status       TEXT,
  provider_message_id   TEXT,
  external_thread_id    TEXT,
  provider_response     JSONB,
  queued_at             TIMESTAMP WITH TIME ZONE,
  dispatched_at         TIMESTAMP WITH TIME ZONE,
  delivered_at          TIMESTAMP WITH TIME ZONE,
  failed_at             TIMESTAMP WITH TIME ZONE,
  replied_at            TIMESTAMP WITH TIME ZONE,
  cancelled_at          TIMESTAMP WITH TIME ZONE,
  expired_at            TIMESTAMP WITH TIME ZONE,
  error_code            TEXT,
  error_summary         TEXT,
  error_type            TEXT,
  reply_summary         TEXT,
  reply_sentiment       TEXT,
  engagement_detected   BOOLEAN DEFAULT FALSE,
  linked_opportunity_id UUID,
  linked_introduction_id UUID,
  linked_gain_id        UUID,
  outcome_type          TEXT,
  source_run_id         UUID,
  source_job_id         UUID,
  dispatched_by         TEXT DEFAULT 'openclaw',
  dispatch_mode         TEXT DEFAULT 'auto',
  requires_approval     BOOLEAN DEFAULT FALSE,
  approval_given_at     TIMESTAMP WITH TIME ZONE,
  created_at            TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at            TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_deliveries_user_channel    ON public.openclaw_channel_deliveries(user_id, channel);
CREATE INDEX IF NOT EXISTS idx_deliveries_channel_action  ON public.openclaw_channel_deliveries(channel_action_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_dispatch_status ON public.openclaw_channel_deliveries(dispatch_status);
CREATE INDEX IF NOT EXISTS idx_deliveries_created         ON public.openclaw_channel_deliveries(created_at DESC);

ALTER TABLE public.openclaw_channel_deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their deliveries"
  ON public.openclaw_channel_deliveries
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_deliveries_updated_at
  BEFORE UPDATE ON public.openclaw_channel_deliveries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ═══════════════════════════════════════════════════════════════
-- CHANNEL CAPABILITY MATRIX
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.openclaw_channel_capabilities (
  channel               TEXT PRIMARY KEY,
  channel_name          TEXT NOT NULL,
  emoji                 TEXT NOT NULL DEFAULT '📡',
  can_prepare           BOOLEAN NOT NULL DEFAULT TRUE,
  can_auto_send         BOOLEAN NOT NULL DEFAULT FALSE,
  can_send_validated    BOOLEAN NOT NULL DEFAULT FALSE,
  can_export_human      BOOLEAN NOT NULL DEFAULT TRUE,
  can_receive_receipt   BOOLEAN NOT NULL DEFAULT FALSE,
  can_track_reply       BOOLEAN NOT NULL DEFAULT FALSE,
  requires_gateway      BOOLEAN NOT NULL DEFAULT FALSE,
  requires_external_api BOOLEAN NOT NULL DEFAULT FALSE,
  availability          TEXT NOT NULL DEFAULT 'prepared',
  honest_note           TEXT,
  updated_at            TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.openclaw_channel_capabilities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All users can read channel capabilities"
  ON public.openclaw_channel_capabilities
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

INSERT INTO public.openclaw_channel_capabilities
  (channel, channel_name, emoji, can_prepare, can_auto_send, can_send_validated, can_export_human, can_receive_receipt, can_track_reply, requires_gateway, requires_external_api, availability, honest_note)
VALUES
  ('email',        'Email',             '📧', TRUE,  FALSE, TRUE,  TRUE,  FALSE, FALSE, FALSE, FALSE, 'sendable', 'Actions préparées. Envoi avec validation humaine possible via le produit.'),
  ('introduction', 'Introduction',      '🤝', TRUE,  FALSE, TRUE,  TRUE,  FALSE, TRUE,  FALSE, FALSE, 'sendable', 'Introductions natives WIINUP. Envoi déclenché côté produit.'),
  ('whatsapp',     'WhatsApp Business', '💬', TRUE,  FALSE, FALSE, TRUE,  FALSE, FALSE, TRUE,  TRUE,  'prepared', 'Préparé uniquement. Envoi réel nécessite WhatsApp Business API + gateway.'),
  ('telegram',     'Telegram',          '✈️', TRUE,  FALSE, FALSE, TRUE,  FALSE, FALSE, TRUE,  TRUE,  'prepared', 'Préparé uniquement. Connexion Telegram Bot nécessaire.'),
  ('slack',        'Slack',             '💼', TRUE,  FALSE, FALSE, TRUE,  FALSE, FALSE, FALSE, TRUE,  'prepared', 'Préparé uniquement. Intégration Slack nécessaire.'),
  ('discord',      'Discord',           '🎮', TRUE,  FALSE, FALSE, TRUE,  FALSE, FALSE, FALSE, TRUE,  'prepared', 'Préparé uniquement. Discord webhook nécessaire.'),
  ('phone',        'Téléphone',         '📞', TRUE,  FALSE, FALSE, TRUE,  FALSE, FALSE, FALSE, FALSE, 'export',   'Export humain uniquement. Pas d automatisation téléphonique.'),
  ('linkedin',     'LinkedIn',          '🔗', TRUE,  FALSE, FALSE, TRUE,  FALSE, FALSE, FALSE, TRUE,  'prepared', 'Préparé uniquement. LinkedIn ne permet pas l auto-envoi conforme.'),
  ('webchat',      'WebChat',           '💻', TRUE,  FALSE, FALSE, TRUE,  FALSE, FALSE, TRUE,  FALSE, 'prepared', 'Préparé uniquement. Widget WebChat nécessaire.')
ON CONFLICT (channel) DO UPDATE SET
  channel_name          = EXCLUDED.channel_name,
  can_prepare           = EXCLUDED.can_prepare,
  can_auto_send         = EXCLUDED.can_auto_send,
  can_send_validated    = EXCLUDED.can_send_validated,
  can_export_human      = EXCLUDED.can_export_human,
  can_receive_receipt   = EXCLUDED.can_receive_receipt,
  can_track_reply       = EXCLUDED.can_track_reply,
  requires_gateway      = EXCLUDED.requires_gateway,
  requires_external_api = EXCLUDED.requires_external_api,
  availability          = EXCLUDED.availability,
  honest_note           = EXCLUDED.honest_note,
  updated_at            = now();
