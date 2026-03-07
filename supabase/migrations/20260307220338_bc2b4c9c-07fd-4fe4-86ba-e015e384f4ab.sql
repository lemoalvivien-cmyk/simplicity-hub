
-- Add missing columns to contacts table so NetworkValueMap can actually read secteur/zone/langue
ALTER TABLE public.contacts 
  ADD COLUMN IF NOT EXISTS secteur text,
  ADD COLUMN IF NOT EXISTS zone text,
  ADD COLUMN IF NOT EXISTS langue text;
