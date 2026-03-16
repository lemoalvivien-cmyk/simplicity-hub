-- ============================================================
-- WIINUP MAX v7 — Seed script for first 5 paying clients
-- Usage: Run in Lovable Cloud > SQL Editor (with service role)
-- Replace the 5 UUIDs below with real auth.users IDs
-- ============================================================

-- INSTRUCTIONS:
-- 1. Create the 5 client accounts via /signup (they get a welcome email)
-- 2. Go to Lovable Cloud > Backend > Auth > Users — copy their user UUIDs
-- 3. Replace uuid_client_1 ... uuid_client_5 below with the real UUIDs
-- 4. Run this script in Cloud > SQL Editor

-- ── Variables (replace these) ────────────────────────────────────────────────
DO $$
DECLARE
  c1 UUID := 'UUID_CLIENT_1';  -- Replace with real UUID
  c2 UUID := 'UUID_CLIENT_2';
  c3 UUID := 'UUID_CLIENT_3';
  c4 UUID := 'UUID_CLIENT_4';
  c5 UUID := 'UUID_CLIENT_5';
  clients UUID[] := ARRAY[c1, c2, c3, c4, c5];
  client_names TEXT[] := ARRAY['Entreprise Alpha', 'Entreprise Beta', 'Entreprise Gamma', 'Entreprise Delta', 'Entreprise Epsilon'];
  u UUID;
  i INTEGER := 1;
BEGIN

  FOREACH u IN ARRAY clients LOOP

    -- ── Entreprise profile ───────────────────────────────────────────────────
    INSERT INTO entreprise_profiles (user_id, nom_entreprise, secteur, zone, abonnement_statut, description)
    VALUES (u, client_names[i], 'B2B Services', 'France', 'founder_pass',
            'Client fondateur WIINUP MAX — accès Founder Pass.')
    ON CONFLICT (user_id) DO UPDATE
      SET abonnement_statut = 'founder_pass', updated_at = NOW();

    -- ── 3 Missions de démo ──────────────────────────────────────────────────
    INSERT INTO missions (owner_user_id, titre, description, secteur, zone, statut, budget_max, recompense_type)
    VALUES
      (u,
       'Cherche partenaires revendeurs SaaS',
       'Nous recherchons des apporteurs d''affaires pour présenter notre solution SaaS à des PME. Commission attractive sur chaque contrat signé.',
       'SaaS / Tech', 'France', 'active', 50000, 'commission'),
      (u,
       'Besoin de contacts DRH grands comptes',
       'Mission prioritaire : identifier des décideurs RH dans des entreprises +200 salariés pour démonstration produit.',
       'RH / Formation', 'Île-de-France', 'active', 30000, 'commission'),
      (u,
       'Développement marché Benelux',
       'Extension commerciale vers la Belgique, Pays-Bas, Luxembourg. Cherche facilitateurs avec réseau local établi.',
       'B2B International', 'Benelux', 'active', 80000, 'commission');

    -- ── 1 Contact de démo ───────────────────────────────────────────────────
    INSERT INTO contacts (owner_user_id, prenom_nom, entreprise, secteur, zone, statut, origine)
    VALUES (u, 'Jean Facilitateur (démo)', 'Réseau WIINUP', 'Conseil B2B', 'France', 'actif', 'wiinup');

    i := i + 1;
  END LOOP;

  RAISE NOTICE '✅ Seed completed for % clients', array_length(clients, 1);

END $$;

-- ── Verify ───────────────────────────────────────────────────────────────────
SELECT
  ep.nom_entreprise,
  ep.abonnement_statut,
  COUNT(DISTINCT m.id)  AS missions,
  COUNT(DISTINCT c.id)  AS contacts
FROM entreprise_profiles ep
LEFT JOIN missions  m ON m.owner_user_id = ep.user_id
LEFT JOIN contacts  c ON c.owner_user_id = ep.user_id
WHERE ep.abonnement_statut = 'founder_pass'
GROUP BY ep.nom_entreprise, ep.abonnement_statut
ORDER BY ep.nom_entreprise;
