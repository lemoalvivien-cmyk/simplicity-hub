
-- Trust score auto-update triggers wiring business loop to Trust Engine

CREATE OR REPLACE FUNCTION public.refresh_trust_score(p_facilitator_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_total integer; v_validees integer; v_refusees integer;
  v_gains_ok integer; v_taux numeric;
  v_quality integer; v_reliability integer; v_compliance integer;
  v_global integer; v_badges text[];
BEGIN
  SELECT COUNT(*) INTO v_total FROM public.introductions WHERE facilitateur_id = p_facilitator_id;
  SELECT COUNT(*) INTO v_validees FROM public.introductions WHERE facilitateur_id = p_facilitator_id AND statut = 'validee';
  SELECT COUNT(*) INTO v_refusees FROM public.introductions WHERE facilitateur_id = p_facilitator_id AND statut = 'refusee';
  SELECT COUNT(*) INTO v_gains_ok FROM public.gains WHERE facilitateur_id = p_facilitator_id AND statut IN ('valide','recu');
  v_taux := CASE WHEN v_total > 0 THEN (v_validees::numeric / v_total) * 100 ELSE 50 END;
  v_quality := LEAST(100, 50 + ROUND(v_taux * 0.5));
  v_reliability := LEAST(100, 50 + v_total * 2);
  v_compliance := CASE WHEN v_refusees = 0 AND v_total > 0 THEN 90 WHEN v_total = 0 THEN 70 ELSE LEAST(90, 70 + ROUND((1 - v_refusees::numeric / GREATEST(v_total,1)) * 30)) END;
  v_global := LEAST(100, ROUND(v_quality * 0.40 + v_reliability * 0.30 + 70 * 0.15 + v_compliance * 0.15));
  v_badges := '{}';
  IF v_global >= 85 THEN v_badges := v_badges || 'expert'; END IF;
  IF v_validees >= 3 THEN v_badges := v_badges || 'introductions_prouvees'; END IF;
  IF v_gains_ok >= 1 THEN v_badges := v_badges || 'premier_gain'; END IF;
  INSERT INTO public.trust_scores (user_id, role, global_score, quality_score, reliability_score, responsiveness_score, compliance_score, total_intros, intros_validees, total_gains, gains_confirmes, badges, last_updated_at)
  VALUES (p_facilitator_id, 'facilitateur', v_global, v_quality, v_reliability, 70, v_compliance, v_total, v_validees, v_gains_ok, v_gains_ok, v_badges, now())
  ON CONFLICT (user_id) DO UPDATE SET
    global_score = EXCLUDED.global_score, quality_score = EXCLUDED.quality_score,
    reliability_score = EXCLUDED.reliability_score, compliance_score = EXCLUDED.compliance_score,
    total_intros = EXCLUDED.total_intros, intros_validees = EXCLUDED.intros_validees,
    total_gains = EXCLUDED.total_gains, gains_confirmes = EXCLUDED.gains_confirmes,
    badges = EXCLUDED.badges, last_updated_at = now();
END;
$$;

CREATE OR REPLACE FUNCTION public.on_introduction_status_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF (OLD.statut IS DISTINCT FROM NEW.statut) AND (NEW.statut IN ('validee','refusee')) THEN
    PERFORM public.refresh_trust_score(NEW.facilitateur_id);
    INSERT INTO public.trust_events (user_id, event_type, impact_score, summary)
    VALUES (NEW.facilitateur_id,
      CASE WHEN NEW.statut = 'validee' THEN 'introduction_acceptee' ELSE 'introduction_refusee' END,
      CASE WHEN NEW.statut = 'validee' THEN 10 ELSE -5 END,
      CASE WHEN NEW.statut = 'validee' THEN 'Introduction validée. +10 points de confiance.' ELSE 'Introduction refusée. -5 points.' END);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_introduction_status_change ON public.introductions;
CREATE TRIGGER trigger_introduction_status_change
  AFTER UPDATE ON public.introductions FOR EACH ROW
  EXECUTE FUNCTION public.on_introduction_status_change();

CREATE OR REPLACE FUNCTION public.on_gain_status_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF (OLD.statut IS DISTINCT FROM NEW.statut) AND (NEW.statut IN ('valide','recu')) THEN
    PERFORM public.refresh_trust_score(NEW.facilitateur_id);
    INSERT INTO public.trust_events (user_id, event_type, impact_score, summary)
    VALUES (NEW.facilitateur_id, 'gain_confirme', 15, 'Gain confirmé. +15 points de confiance.');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_gain_status_change ON public.gains;
CREATE TRIGGER trigger_gain_status_change
  AFTER UPDATE ON public.gains FOR EACH ROW
  EXECUTE FUNCTION public.on_gain_status_change();
