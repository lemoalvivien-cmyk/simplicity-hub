-- PALANTIR CERT — Security hardening
-- 1. promo_codes: restrict SELECT to admin only (no code enumeration)
-- 2. facilitateur_profiles: remove overly broad auth policy
-- 3. Add covering index for notifications (performance)
-- 4. Add covering index for lead_intakes summary query

-- 1. Drop the leaky promo_codes SELECT policy for all authenticated users
DROP POLICY IF EXISTS "promo_codes_select_active" ON public.promo_codes;

-- Only admins can read promo codes directly.
-- Frontend redeem flow goes through the redeem-promo Edge Function (service_role).
CREATE POLICY "promo_codes_admin_only_select"
  ON public.promo_codes
  FOR SELECT
  TO authenticated
  USING ( public.has_role(auth.uid(), 'admin') );

-- 2. Drop the overly broad facilitateur_profiles policy
DROP POLICY IF EXISTS "Authenticated users can view all facilitateur profiles" ON public.facilitateur_profiles;
-- The more restrictive policies (public view active + owner view own) remain.

-- 3. Performance: covering index for notifications (used by NotificationBell)
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON public.notifications (user_id, read, created_at DESC);

-- 4. Performance: covering index for lead_intakes summary (fetchLeadPipelineSummary)
CREATE INDEX IF NOT EXISTS idx_lead_intakes_user_qual
  ON public.lead_intakes (user_id, qualification_status);

CREATE INDEX IF NOT EXISTS idx_lead_intakes_entreprise_qual
  ON public.lead_intakes (entreprise_id, qualification_status);