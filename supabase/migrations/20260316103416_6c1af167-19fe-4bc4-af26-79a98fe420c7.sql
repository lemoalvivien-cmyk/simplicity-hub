-- AUDIT 16/03/2026 – BLOQUANTS LEVÉS
-- Fonction seed_demo_data : injecte 3 missions + 1 contact démo pour les nouveaux comptes entreprise.
-- Appelée côté client après onboarding_done = true.

CREATE OR REPLACE FUNCTION public.seed_demo_data(
  p_user_id UUID,
  p_role TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_role <> 'entreprise' THEN
    RETURN;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.missions WHERE entreprise_id = p_user_id LIMIT 1
  ) THEN
    RETURN;
  END IF;

  INSERT INTO public.contacts (
    id, owner_user_id, prenom_nom, entreprise, email, secteur, statut, origine
  ) VALUES (
    gen_random_uuid(), p_user_id, 'Sophie Martin (Démo)', 'Acme Corp',
    'sophie.martin@demo.wiinup.com', 'SaaS / Tech', 'prospect', 'demo'
  );

  INSERT INTO public.missions (
    id, entreprise_id, titre, description, secteur, zone, remuneration, statut, type_mission, created_at
  ) VALUES (
    gen_random_uuid(), p_user_id,
    'Trouver des clients SaaS en France (Démo)',
    'Nous cherchons des apporteurs qui peuvent nous mettre en relation avec des DSI ou responsables IT dans des PME françaises de 50 à 500 personnes.',
    'SaaS / Tech', 'France', 2500, 'active', 'apport_affaires', now()
  );

  INSERT INTO public.missions (
    id, entreprise_id, titre, description, secteur, zone, remuneration, statut, type_mission, created_at
  ) VALUES (
    gen_random_uuid(), p_user_id,
    'Développement commercial Europe (Démo)',
    'Recherche de partenaires avec un réseau fort en Belgique, Suisse et Luxembourg pour présenter notre offre à des PME industrielles.',
    'Industrie / Manufacturing', 'Europe', 3000, 'active', 'apport_affaires', now() - interval '1 day'
  );

  INSERT INTO public.missions (
    id, entreprise_id, titre, description, secteur, zone, remuneration, statut, type_mission, created_at
  ) VALUES (
    gen_random_uuid(), p_user_id,
    'Introductions dans le secteur santé (Démo)',
    'Nous souhaitons être présentés à des directeurs d''établissements de santé ou des DSI hospitaliers.',
    'Santé / MedTech', 'France', 1800, 'active', 'apport_affaires', now() - interval '2 days'
  );

END;
$$;

REVOKE ALL ON FUNCTION public.seed_demo_data(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.seed_demo_data(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.seed_demo_data(UUID, TEXT) TO service_role;

COMMENT ON TABLE public.ada_sessions IS 'AUDIT 16/03/2026 – DÉSACTIVÉ POUR GTM. Module ADA Voice Agent non lancé.';
COMMENT ON TABLE public.ada_training_runs IS 'AUDIT 16/03/2026 – DÉSACTIVÉ POUR GTM. Module ADA Training non lancé.';
COMMENT ON TABLE public.ada_training_samples IS 'AUDIT 16/03/2026 – DÉSACTIVÉ POUR GTM. Module ADA Training non lancé.';
COMMENT ON TABLE public.etg_companies IS 'AUDIT 16/03/2026 – DÉSACTIVÉ POUR GTM. Module ETG non lancé.';
COMMENT ON TABLE public.etg_persons IS 'AUDIT 16/03/2026 – DÉSACTIVÉ POUR GTM. Module ETG non lancé.';
COMMENT ON TABLE public.etg_links IS 'AUDIT 16/03/2026 – DÉSACTIVÉ POUR GTM. Module ETG non lancé.';
COMMENT ON TABLE public.etg_opportunities IS 'AUDIT 16/03/2026 – DÉSACTIVÉ POUR GTM. Module ETG non lancé.';
COMMENT ON TABLE public.etg_hidden_links IS 'AUDIT 16/03/2026 – DÉSACTIVÉ POUR GTM. Module ETG non lancé.';