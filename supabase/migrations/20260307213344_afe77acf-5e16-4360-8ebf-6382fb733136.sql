
-- ═══════════════════════════════════════════════════════════════
-- 1. find_best_access_path() — SQL function (was missing from DB)
-- ═══════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.find_best_access_path(
  p_user_id         uuid,
  p_target_sector   text DEFAULT NULL,
  p_target_zone     text DEFAULT NULL,
  p_target_corridor text DEFAULT NULL,
  p_target_language text DEFAULT NULL,
  p_limit           integer DEFAULT 5
)
RETURNS TABLE(
  facilitator_id    uuid,
  global_score      integer,
  sector_score      integer,
  zone_score        integer,
  corridor_score    integer,
  language_score    integer,
  trust_score       integer,
  conversion_score  integer,
  response_score    integer,
  total_intros      integer,
  intros_validees   integer,
  revenue           numeric,
  explanation       text[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_fac   RECORD;
  v_match jsonb;
BEGIN
  FOR v_fac IN
    SELECT fp.user_id
    FROM public.facilitateur_profiles fp
    WHERE fp.statut = 'actif'
    ORDER BY fp.response_rate DESC NULLS LAST
    LIMIT 40
  LOOP
    v_match := public.compute_facilitator_match(
      p_user_id,
      v_fac.user_id,
      p_target_sector,
      p_target_zone,
      p_target_corridor,
      p_target_language
    );

    facilitator_id   := (v_match->>'facilitator_id')::uuid;
    global_score     := COALESCE((v_match->>'global_score')::integer, 0);
    sector_score     := COALESCE((v_match->>'sector_score')::integer, 0);
    zone_score       := COALESCE((v_match->>'zone_score')::integer, 0);
    corridor_score   := COALESCE((v_match->>'corridor_score')::integer, 0);
    language_score   := COALESCE((v_match->>'language_score')::integer, 0);
    trust_score      := COALESCE((v_match->>'trust_score')::integer, 50);
    conversion_score := COALESCE((v_match->>'conversion_score')::integer, 0);
    response_score   := COALESCE((v_match->>'response_score')::integer, 50);
    total_intros     := COALESCE((v_match->>'total_intros')::integer, 0);
    intros_validees  := COALESCE((v_match->>'intros_validees')::integer, 0);
    revenue          := COALESCE((v_match->>'revenue')::numeric, 0);
    explanation      := ARRAY(SELECT jsonb_array_elements_text(v_match->'explanation'));

    RETURN NEXT;
  END LOOP;
END;
$$;

-- ═══════════════════════════════════════════════════════════════
-- 2. Auto-feed graph trigger: introduction validated
-- ═══════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.auto_feed_graph_on_intro()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (OLD.statut IS DISTINCT FROM NEW.statut) AND NEW.statut = 'validee' THEN
    IF NEW.facilitateur_id IS NOT NULL AND NEW.entreprise_id IS NOT NULL THEN
      PERFORM public.upsert_graph_edge(
        NEW.facilitateur_id,
        NEW.facilitateur_id,
        'facilitateur',
        NEW.entreprise_id,
        'entreprise',
        'introduced',
        'introduction_validee',
        85, 80, 70, 0,
        jsonb_build_object('introduction_id', NEW.id, 'mission_id', NEW.mission_id)
      );
    END IF;
    INSERT INTO public.graph_events (user_id, event_type, entity_type, entity_id, delta_weight, summary)
    VALUES (
      NEW.facilitateur_id, 'introduction_validee', 'introduction', NEW.id, 15,
      'Introduction validée — lien renforcé dans le graphe'
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_graph_feed_intro ON public.introductions;
CREATE TRIGGER trigger_graph_feed_intro
  AFTER UPDATE ON public.introductions
  FOR EACH ROW EXECUTE FUNCTION public.auto_feed_graph_on_intro();

-- ═══════════════════════════════════════════════════════════════
-- 3. Auto-feed graph trigger: gain confirmed
-- ═══════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.auto_feed_graph_on_gain()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_revenue_score integer;
BEGIN
  IF (OLD.statut IS DISTINCT FROM NEW.statut) AND NEW.statut IN ('valide', 'recu') THEN
    v_revenue_score := LEAST(100, ROUND(COALESCE(NEW.montant, 0) / 100.0));
    PERFORM public.upsert_graph_edge(
      NEW.facilitateur_id,
      NEW.facilitateur_id,
      'facilitateur',
      COALESCE(NEW.introduction_id, NEW.facilitateur_id),
      CASE WHEN NEW.introduction_id IS NOT NULL THEN 'introduction' ELSE 'facilitateur' END,
      'converted_with',
      'gain_confirme',
      90, 90, 90, v_revenue_score,
      jsonb_build_object('gain_id', NEW.id, 'montant', NEW.montant)
    );
    INSERT INTO public.graph_events (user_id, event_type, entity_type, entity_id, delta_weight, summary)
    VALUES (
      NEW.facilitateur_id, 'gain_confirme', 'gain', NEW.id, 20,
      'Gain confirmé — conversion enregistrée dans le graphe'
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_graph_feed_gain ON public.gains;
CREATE TRIGGER trigger_graph_feed_gain
  AFTER UPDATE ON public.gains
  FOR EACH ROW EXECUTE FUNCTION public.auto_feed_graph_on_gain();

-- ═══════════════════════════════════════════════════════════════
-- 4. Auto-feed graph trigger: mission created
-- ═══════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.auto_feed_graph_on_mission()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.graph_events (user_id, event_type, entity_type, entity_id, delta_weight, summary)
  VALUES (
    NEW.entreprise_id, 'mission_created', 'mission', NEW.id, 5,
    'Mission créée — signal d''activité enregistré dans le graphe'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_graph_feed_mission ON public.missions;
CREATE TRIGGER trigger_graph_feed_mission
  AFTER INSERT ON public.missions
  FOR EACH ROW EXECUTE FUNCTION public.auto_feed_graph_on_mission();
