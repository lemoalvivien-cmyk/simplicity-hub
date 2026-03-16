
-- ═══════════════════════════════════════════════════════════════════════════
-- submit_introduction_atomic — Transaction PL/pgSQL garantie ACID
-- Une seule fonction, un seul round-trip, rollback automatique si échec.
-- Remplace les 4 inserts séquentiels non atomiques de l'edge function.
-- SECURITY DEFINER avec search_path fixé (protection injection schéma).
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.submit_introduction_atomic(
  p_facilitateur_id   uuid,
  p_entreprise_id     uuid,
  p_mission_id        uuid,
  p_contact_nom       text,
  p_contact_email     text,
  p_contact_telephone text,
  p_contexte          text,
  p_pertinence        text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_intro_id uuid;
  v_gain_id  uuid;
BEGIN
  -- ── Validation entrées ──────────────────────────────────────────────────
  IF p_facilitateur_id IS NULL THEN
    RAISE EXCEPTION 'facilitateur_id is required';
  END IF;
  IF p_entreprise_id IS NULL THEN
    RAISE EXCEPTION 'entreprise_id is required';
  END IF;
  IF p_contact_nom IS NULL OR trim(p_contact_nom) = '' THEN
    RAISE EXCEPTION 'contact_nom is required';
  END IF;
  IF p_contexte IS NULL OR trim(p_contexte) = '' THEN
    RAISE EXCEPTION 'contexte is required';
  END IF;

  -- ── Step 1 : Introduction ───────────────────────────────────────────────
  INSERT INTO public.introductions (
    facilitateur_id,
    entreprise_id,
    mission_id,
    contact_nom,
    contact_email,
    contact_telephone,
    contexte,
    pertinence,
    statut
  ) VALUES (
    p_facilitateur_id,
    p_entreprise_id,
    p_mission_id,
    trim(left(p_contact_nom, 150)),
    CASE WHEN p_contact_email IS NOT NULL AND trim(p_contact_email) != ''
         THEN trim(left(p_contact_email, 254)) END,
    CASE WHEN p_contact_telephone IS NOT NULL AND trim(p_contact_telephone) != ''
         THEN trim(left(p_contact_telephone, 20)) END,
    trim(left(p_contexte, 2000)),
    CASE WHEN p_pertinence IS NOT NULL AND trim(p_pertinence) != ''
         THEN trim(left(p_pertinence, 1000)) END,
    'en_attente'
  )
  RETURNING id INTO v_intro_id;

  -- ── Step 2 : Gain ────────────────────────────────────────────────────────
  INSERT INTO public.gains (
    facilitateur_id,
    introduction_id,
    mission_id,
    source,
    statut,
    montant
  ) VALUES (
    p_facilitateur_id,
    v_intro_id,
    p_mission_id,
    'mission_directe',
    'en_attente',
    NULL
  )
  RETURNING id INTO v_gain_id;

  -- ── Step 3 : Escrow ──────────────────────────────────────────────────────
  INSERT INTO public.intro_escrow (
    facilitator_id,
    company_id,
    introduction_id,
    status,
    protected
  ) VALUES (
    p_facilitateur_id,
    p_entreprise_id,
    v_intro_id,
    'demandee',
    true
  );

  -- ── Step 4 : Preuve ──────────────────────────────────────────────────────
  INSERT INTO public.introduction_proofs (
    facilitator_id,
    company_id,
    introduction_id,
    proof_status,
    validation_status
  ) VALUES (
    p_facilitateur_id,
    p_entreprise_id,
    v_intro_id,
    'brouillon',
    'en_attente'
  );

  -- ── Résultat ─────────────────────────────────────────────────────────────
  RETURN jsonb_build_object(
    'success',          true,
    'introduction_id',  v_intro_id,
    'gain_id',          v_gain_id
  );

EXCEPTION
  WHEN OTHERS THEN
    -- Rollback automatique de la transaction complète
    RAISE EXCEPTION 'submit_introduction_atomic failed: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
END;
$$;

-- ── Sécurité : accès uniquement aux utilisateurs authentifiés ───────────────
REVOKE ALL ON FUNCTION public.submit_introduction_atomic(
  uuid, uuid, uuid, text, text, text, text, text
) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.submit_introduction_atomic(
  uuid, uuid, uuid, text, text, text, text, text
) TO authenticated;

COMMENT ON FUNCTION public.submit_introduction_atomic IS
  'Insère atomiquement : introduction + gain + escrow + proof en une seule transaction. SECURITY DEFINER.';
