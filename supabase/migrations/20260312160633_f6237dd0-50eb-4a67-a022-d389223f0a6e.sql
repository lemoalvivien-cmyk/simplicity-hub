
-- ============================================================
-- SECURITY HARDENING MIGRATION
-- Fixes all critical/warn findings from security scan:
-- 1. qualified_interests — remove public service_role policy
-- 2. trust_events — ownership check on INSERT
-- 3. promo_codes — remove public SELECT, add server-side only
-- 4. notifications — restrict INSERT to service_role
-- 5. mission_matches — restrict INSERT to service_role
-- 6. offer_packs — require auth on SELECT
-- ============================================================

-- ── 1. qualified_interests ────────────────────────────────────────────────────
-- Drop the misconfigured policy applied to public role
DROP POLICY IF EXISTS "Service role can manage qualified interests" ON public.qualified_interests;

-- Correct policies: only service_role can do full CRUD;
-- facilitators can only read their own rows.
CREATE POLICY "Service role full access to qualified interests"
  ON public.qualified_interests
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Facilitators can read own qualified interests"
  ON public.qualified_interests
  FOR SELECT
  TO authenticated
  USING (auth.uid() = facilitator_id);

-- ── 2. trust_events — ownership check on INSERT ───────────────────────────────
-- Drop the over-permissive policy
DROP POLICY IF EXISTS "Authenticated can insert trust events" ON public.trust_events;

-- Recreate with strict ownership check
CREATE POLICY "Users can insert own trust events"
  ON public.trust_events
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Service role bypass for automated scoring
CREATE POLICY "Service role full access to trust events"
  ON public.trust_events
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ── 3. promo_codes — remove public SELECT exposure ───────────────────────────
-- Remove the blanket public read policy
DROP POLICY IF EXISTS "Anyone can read promo codes for validation" ON public.promo_codes;

-- Only service_role (edge functions) can read/write promo codes
-- The redeem-promo edge function uses service_role key
CREATE POLICY "Service role manages promo codes"
  ON public.promo_codes
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Admins can read promo codes
CREATE POLICY "Admins can read promo codes"
  ON public.promo_codes
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ── 4. notifications — restrict INSERT to service_role ───────────────────────
DROP POLICY IF EXISTS "Service role can insert notifications" ON public.notifications;

-- Only service_role (webhooks, edge functions) can insert notifications
CREATE POLICY "Service role inserts notifications"
  ON public.notifications
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Users can read their own notifications
DROP POLICY IF EXISTS "Users can read own notifications" ON public.notifications;
CREATE POLICY "Users can read own notifications"
  ON public.notifications
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications"
  ON public.notifications
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── 5. mission_matches — restrict INSERT to service_role ─────────────────────
DROP POLICY IF EXISTS "Service role can insert mission matches" ON public.mission_matches;

-- Only service_role (AI matching engine) can insert matches
CREATE POLICY "Service role manages mission matches"
  ON public.mission_matches
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Entreprise users can read matches for their own missions
DROP POLICY IF EXISTS "Entreprise can read their mission matches" ON public.mission_matches;
CREATE POLICY "Entreprise can read their mission matches"
  ON public.mission_matches
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.missions m
      WHERE m.id = mission_id
        AND m.entreprise_id = auth.uid()
    )
  );

-- Facilitators can read matches where they are the facilitateur
DROP POLICY IF EXISTS "Facilitateurs can read own mission matches" ON public.mission_matches;
CREATE POLICY "Facilitateurs can read own mission matches"
  ON public.mission_matches
  FOR SELECT
  TO authenticated
  USING (auth.uid() = facilitateur_id);

-- ── 6. offer_packs — require auth on SELECT ──────────────────────────────────
DROP POLICY IF EXISTS "Facilitators can view approved packs" ON public.offer_packs;

-- Require authentication for viewing approved packs
CREATE POLICY "Authenticated facilitators can view approved packs"
  ON public.offer_packs
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() IS NOT NULL
    AND (status = 'approved' OR status = 'active')
  );

-- Service role bypass
DROP POLICY IF EXISTS "Service role manages offer packs" ON public.offer_packs;
CREATE POLICY "Service role manages offer packs"
  ON public.offer_packs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
