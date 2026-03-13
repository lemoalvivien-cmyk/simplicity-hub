# WiinupMax — Conformité & Sécurité

> Document de référence interne. Dernière mise à jour : 13 mars 2026.

---

## 1. RGPD (Règlement Général sur la Protection des Données)

### Base légale des traitements

| Traitement | Base légale | Durée de conservation |
|---|---|---|
| Authentification (email + mot de passe) | Exécution du contrat | Durée de l'abonnement + 1 an |
| Données de profil professionnel | Exécution du contrat | Durée de l'abonnement + 3 ans |
| Contacts importés par l'utilisateur | Intérêt légitime (prospection B2B) | Jusqu'à suppression par l'utilisateur |
| Analytics d'usage (anonymisés) | Intérêt légitime | 13 mois glissants |
| Données de facturation Stripe | Obligation légale (comptabilité) | 10 ans |
| Consentement vocal ADA | Consentement explicite (art. 6.1.a + art. 9 si voix biométrique) | Durée de l'abonnement + 1 an |
| Logs d'audit (etg_audit_log) | Obligation légale + sécurité | 5 ans |

### Droits des personnes

Les utilisateurs peuvent exercer leurs droits via : **contact@wiinupmax.com**

- **Droit d'accès** (art. 15) : export complet des données sous 30 jours
- **Droit de rectification** (art. 16) : mise à jour via le profil utilisateur
- **Droit à l'effacement** (art. 17) : suppression du compte + purge des données personnelles identifiantes sous 30 jours (sauf obligations légales)
- **Droit à la portabilité** (art. 20) : export JSON/CSV des contacts et missions
- **Droit d'opposition** (art. 21) : opt-out des communications marketing

### Sous-traitants (art. 28)

| Sous-traitant | Rôle | Localisation | DPA signé |
|---|---|---|---|
| Supabase Inc. | BDD, Auth, Edge Functions | US-East-1 (AWS) | Oui |
| Stripe Payments Europe Ltd. | Paiements | IE / EU | Oui |
| ElevenLabs Inc. | Synthèse vocale IA | USA | Oui (SCCs) |
| Lovable (Builder.io Inc.) | Hébergement frontend | USA | Oui (SCCs) |

### Transferts hors UE

Les données sont traitées par des sous-traitants américains. Les transferts sont encadrés par :
- **Clauses Contractuelles Types (SCCs)** de la Commission Européenne (décision 2021/914)
- **Addendum UK** pour les données UK le cas échéant

---

## 2. Consentement Vocal ADA

### Cadre légal applicable

- RGPD art. 6.1.a (consentement) + art. 9 (données biométriques si traitement de la voix à des fins d'identification)
- Directive IA UE 2024/1689 (systèmes IA à risque limité → obligations de transparence)
- Loi n° 78-17 (Informatique et Libertés)

### Protocole de consentement implémenté

1. **Double opt-in obligatoire** avant tout appel ADA :
   - Checkbox explicite : *"J'accepte que ma voix soit enregistrée et analysée par IA à des fins de closing commercial. Je peux retirer mon consentement à tout moment."*
   - Enregistrement dans `ada_consent_logs` avec : timestamp, session_id, ip_hash, user_agent_hash, consent_text

2. **Révocation** : disponible à tout moment via `/account` → section "Consentement vocal"

3. **Transparence** : l'interlocuteur est informé en début d'appel qu'il communique avec un agent IA.

4. **Rétention** : enregistrements vocaux supprimés après 90 jours (référence ElevenLabs `elevenlabs_audio_ref`)

### Script de mention obligatoire (début d'appel ADA)

> *"Bonjour, cet appel est réalisé par ADA, un agent commercial IA de [Nom Entreprise]. Cet appel peut être enregistré à des fins d'amélioration du service. Pour vous opposer à cet enregistrement, vous pouvez raccrocher à tout moment."*

---

## 3. Conformité Bloctel

### Obligation légale

La loi Hamon (2014) et le décret n° 2016-1238 imposent aux professionnels effectuant de la prospection téléphonique de vérifier les numéros sur la liste d'opposition Bloctel avant tout appel.

### Procédure WiinupMax

1. **Avant tout appel ADA** vers un prospect non-client :
   - Vérification Bloctel obligatoire via l'API officielle (https://www.bloctel.gouv.fr/)
   - Fréquence : rechargement mensuel de la liste (max 30 jours entre deux vérifications)

2. **Exemptions légales** (appels exemptés de vérification) :
   - Prospects ayant une relation contractuelle préexistante avec l'entreprise
   - Appels réalisés suite à une demande explicite du prospect (inbound)

3. **Traçabilité** : chaque vérification Bloctel doit être enregistrée (date, numéro hashé, résultat) dans `ada_consent_logs` avec `consent_type = 'bloctel_check'`

4. **Sanction** : non-respect passible d'une amende jusqu'à 75 000 € (personne physique) / 375 000 € (personne morale)

### TODO avant mise en production des appels sortants

- [ ] Souscrire à l'API Bloctel professionnelle
- [ ] Implémenter la vérification dans `ada-voice-call` Edge Function
- [ ] Documenter les exemptions avec preuve contractuelle

---

## 4. Directive IA (EU AI Act 2024/1689)

### Classification du système

WiinupMax ADA est classé **système IA à risque limité** (art. 50) :
- IA générant du contenu vocal interagissant avec des humains → obligation de transparence
- Pas de classification "haut risque" (pas de RH, crédit, infrastructure critique)

### Obligations applicables

- [x] Divulgation de l'IA : mention explicite en début d'interaction
- [x] Pas de manipulation psychologique interdite (art. 5.1.b)
- [ ] Documentation technique du système (Annexe IV) — à compléter pour certification
- [ ] Registre des systèmes IA (si > 50 employés ou CA > 10M€ — non applicable actuellement)

---

## 5. Sécurité Technique

### RLS (Row Level Security)

Toutes les tables métier ont RLS activé. Politique par défaut : `DENY ALL`.

Tables critiques et leurs politiques :
- `profiles` : lecture/écriture uniquement par `auth.uid() = id`
- `subscriptions` : lecture par owner, write uniquement par service_role
- `billing_events` : lecture admin uniquement
- `etg_*` : lecture/écriture par `user_id = auth.uid()` + admin
- `ada_sessions` : lecture/écriture par `owner_user_id = auth.uid()`

### Rate Limiting

- 100 req/min/user via `check_rate_limit()` (SECURITY DEFINER)
- Réponse 429 avec `Retry-After: 60`
- Nettoyage automatique des fenêtres expirées via `cleanup_rate_limits()`

### Secrets Management

Aucun secret privé dans le code source. Gestion via :
- Variables d'environnement Supabase Edge Functions (STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, ELEVENLABS_API_KEY)
- Clés publiques (anon key, publishable key) : OK dans le codebase

### Audit Logs

- `etg_audit_log` : toutes les mutations ETG
- `ada_consent_logs` : consentements vocaux
- `billing_events` : tous les événements Stripe
- `payout_audit_log` : mutations de statut payout

---

## 6. Checklist Pré-Production

### Légal
- [x] CGU publiées et accessibles
- [x] Politique de confidentialité RGPD complète
- [x] Mentions légales (LCEN art. 6)
- [ ] Registre des activités de traitement (art. 30 RGPD) — document interne
- [ ] DPO désigné si > 250 employés (non applicable actuellement)
- [ ] Mentions Bloctel sur les pages de capture téléphone

### Technique
- [x] RLS sur toutes les tables
- [x] JWT validation in-code sur les Edge Functions
- [x] HMAC Stripe webhook
- [x] CORS dynamique (pas de wildcard *)
- [x] Rate limiting actif
- [ ] Pen test externe avant lancement grand public
- [ ] WAF (Web Application Firewall) — à activer via Cloudflare

### Opérationnel
- [x] Procédure de gestion des incidents (contact@wiinupmax.com)
- [ ] Plan de réponse aux violations de données (notification CNIL sous 72h)
- [ ] Backup quotidien vérifié (Supabase PITR activé)
