## Eternal Trust Graph (ETG) v1

Architecture Palantir Gotham 2026 — graphe de confiance pondéré, anonymisé, prédictif.

### Tables SQL

| Table | Description |
|---|---|
| `etg_persons` | Nœuds personnes — anonymisés par SHA-256(email/userId) |
| `etg_companies` | Nœuds entreprises — anonymisés par SHA-256(domain) |
| `etg_links` | Arêtes pondérées : `INTRODUCED_BY`, `TRUSTS`, `DEAL_CLOSED` (trust_score, hidden_link_strength, commission 7%) |
| `etg_hidden_links` | Liens latents inférés par le moteur (≥2 intermédiaires communs) |
| `etg_opportunities` | Opportunités prédictives 6-12 semaines avec scoring de précision croissant |
| `etg_audit_log` | Journal d'audit complet — accès admin uniquement via RLS |

### Edge Functions Deno

| Fonction | Rôle |
|---|---|
| `etg-aggregate` | `aggregate_anonymous_graph()` — pipeline complet : upsert persons/companies/links + inférence hidden links |
| `etg-predict` | Génère les opportunités 6-12 semaines avec scoring pondéré (trust 35%, liens cachés 20%, deals 15%, secteur 15%, zone 10%, récence 5%) |
| `etg-ingest` | Ingère des événements temps réel : `introduction_validee`, `gain_confirme`, `deal_closed` |

### Fonctions SQL

- `etg_predict_opportunities(user_id, weeks_min, weeks_max, min_confidence, limit)` — query prédictive sécurisée
- `etg_graph_stats(user_id)` — stats JSONB complètes
- `etg_write_audit(...)` — helper audit

### Hook React

```tsx
import { useEternalGraph } from "@/hooks/useEternalGraph";

const { stats, opportunities, links, hiddenLinks, aggregate, generatePredictions, ingestEvent } = useEternalGraph();

// Agréger le graphe
await aggregate();

// Générer les prédictions 6-12 semaines
await generatePredictions(6, 12);

// Ingérer un événement
await ingestEvent("gain_confirme", gainId);
```

### Composant Visualisation

```tsx
import { EternalGraphPanel } from "@/components/graph/EternalGraphPanel";

<EternalGraphPanel className="w-full" />
```

### Sécurité

- **RLS strict** : chaque table isolée par `user_id = auth.uid()`
- **JWT validé** in-code sur les 3 edge functions (aucune requête anonyme)
- **Anonymisation SHA-256** : aucun email/nom en clair dans le graphe
- **Audit log** : toute mutation ETG est tracée dans `etg_audit_log` (lecture admin only)
- **Rate limit** : hérite du middleware `check_rate_limit` existant
- **Prêt ZK/Blockchain** : architecture prévue — colonnes `anon_hash` + `inference_path` compatibles extension cryptographique dans 60 jours

### Git Merge

```sh
# Vérifier les migrations
supabase db diff

# Déployer les fonctions
supabase functions deploy etg-aggregate etg-predict etg-ingest

# Vérifier
curl -X POST https://<project>.supabase.co/functions/v1/etg-aggregate \
  -H "Authorization: Bearer <token>" \
  -d '{"action":"get_stats"}'
```
