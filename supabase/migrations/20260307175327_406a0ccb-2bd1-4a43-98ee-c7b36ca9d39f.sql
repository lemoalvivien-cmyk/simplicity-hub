-- Expand seed_openclaw_channels with Telegram, Slack, Discord, WebChat
CREATE OR REPLACE FUNCTION public.seed_openclaw_channels(p_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.openclaw_channels (user_id, channel_id, channel_name, status, is_ready, is_openclaw_enabled)
  VALUES
    (p_user_id, 'email',        'Email',             'pret',          true,  true),
    (p_user_id, 'phone',        'Téléphone',         'assiste',       false, false),
    (p_user_id, 'whatsapp',     'WhatsApp Business', 'non_configure', false, false),
    (p_user_id, 'introduction', 'Introductions',     'pret',          true,  true),
    (p_user_id, 'linkedin',     'LinkedIn',          'non_configure', false, false),
    (p_user_id, 'telegram',     'Telegram',          'non_configure', false, false),
    (p_user_id, 'slack',        'Slack',             'non_configure', false, false),
    (p_user_id, 'discord',      'Discord',           'non_configure', false, false),
    (p_user_id, 'webchat',      'WebChat',           'non_configure', false, false)
  ON CONFLICT DO NOTHING;
END;
$function$;

-- Index for faster channel lookups
CREATE INDEX IF NOT EXISTS idx_openclaw_channels_user_channel ON public.openclaw_channels (user_id, channel_id);
CREATE INDEX IF NOT EXISTS idx_openclaw_jobs_user_next ON public.openclaw_jobs (user_id, next_run_at);