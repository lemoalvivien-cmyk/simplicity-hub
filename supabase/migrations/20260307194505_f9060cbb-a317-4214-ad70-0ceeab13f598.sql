
-- Réactiver les triggers business OpenClaw (étaient en tgenabled='O' = DISABLED)
ALTER TABLE public.missions      ENABLE TRIGGER trg_openclaw_missions;
ALTER TABLE public.offers        ENABLE TRIGGER trg_openclaw_offers;
ALTER TABLE public.introductions ENABLE TRIGGER trg_openclaw_introductions;
ALTER TABLE public.gains         ENABLE TRIGGER trg_openclaw_gains;
ALTER TABLE public.disputes      ENABLE TRIGGER trg_openclaw_disputes;
