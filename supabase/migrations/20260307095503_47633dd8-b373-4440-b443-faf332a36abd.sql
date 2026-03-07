
-- Fix: La policy "Service role can insert logs" utilise WITH CHECK (true) ce qui est permissif
-- On la restreint correctement : seule la service role peut insérer des logs (pas les users directs)
DROP POLICY IF EXISTS "Service role can insert logs" ON public.openclaw_logs;

-- Les logs sont insérés uniquement via edge functions (service role) ou par l'utilisateur propriétaire
CREATE POLICY "Users can insert their own openclaw logs"
  ON public.openclaw_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);
