-- Add target_market column to profiles for B2B/B2C/Les deux
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS target_market TEXT;

-- Add objectif column to profiles for the main goal
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS objectif TEXT;
