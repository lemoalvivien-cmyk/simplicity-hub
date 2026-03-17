-- Fix Function Search Path Mutable warning for user-defined function
ALTER FUNCTION public.reset_insights_monthly_quota() SET search_path = public;