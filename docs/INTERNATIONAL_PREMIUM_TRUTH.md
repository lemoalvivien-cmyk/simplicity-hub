# INTERNATIONAL PREMIUM TRUTH — WIINUP MAX
Version: 2026-03-08

## Langues déclarées (10)
fr · en · es · pt · ru · zh · hi · bn · ar · he

---

## Ce qui EXISTE réellement dans le code

### src/lib/formatLocale.ts — EXISTE ✅
- `formatAmount(value, lang, currency)` — montant localisé via Intl
- `formatNumber(value, lang)` — séparateurs locaux
- `formatPercent(value, lang)` — pourcentage localisé
- `formatDateShort(date, lang)` — date courte localisée
- `formatDateRelative(date, lang)` — date relative localisée
- `formatCompact(value, lang)` — nombre abrégé (1.2K…)

### src/lib/i18n.ts — EXISTE ✅
- 10 langues configurées
- ~180 clés par langue principale (fr, en, es)
- Clés couvertes : Nav, Dashboard, Hero, Pricing (titres + listes + FAQ), BestAccessPanel, Corridors, Marketplace, PassiveOS, Ops/WarRoom, GoLive, Statuts
- RTL auto : ar et he → `dir="rtl"` sur `<html>` via `setLanguage()` et init

---

## Couverture réelle par fichier/zone

| Fichier / Zone | État |
|---|---|
| `src/components/landing/HeroSection.tsx` | ✅ 100% useTranslation — zéro hardcodé |
| `src/pages/Pricing.tsx` | ✅ 100% useTranslation — moteur1/2, apporteur, FAQ branchés |
| `src/components/graph/BestAccessPanel.tsx` | ✅ 100% useTranslation |
| Nav (UserNav, PublicNav) | ✅ Partiellement via t() |
| DashboardEntreprise | ⚠️ Clés i18n présentes — branchement t() non systématique |
| DashboardFacilitateur | ⚠️ Clés i18n présentes — branchement t() non systématique |
| PassiveOS | ⚠️ Clés disponibles — pages encore majoritairement hardcodées |
| Operations / WarRoom | ⚠️ Clés disponibles — pages non encore branchées |
| Admin pages | ✅ En français intentionnel (back-office admin = usage interne) |
| Onboarding | ⚠️ Non encore internationalisé |
| Checkout / Success | ⚠️ Non encore internationalisé |

---

## Chaînes hardcodées SUPPRIMÉES dans ce chantier

| Fichier | Chaîne supprimée |
|---|---|
| `src/pages/Pricing.tsx` | `const moteur1Items = [...]` — 6 chaînes FR |
| `src/pages/Pricing.tsx` | `const moteur2Items = [...]` — 6 chaînes FR |
| `src/pages/Pricing.tsx` | `const apporteurIncludes = [...]` — 6 chaînes FR |
| `src/pages/Pricing.tsx` | `const faqItems = [...]` — 5 Q/R FR hardcodées |

---

## Support RTL — état réel

- `ar` et `he` : `dir="rtl"` appliqué sur `<html>` automatiquement à l'init et au changement
- Tailwind respecte `dir="rtl"` nativement (flex, text-align)
- Radix UI composants : support RTL natif via direction
- **Non testé visuellement page par page** — risque de débordement sur mobile pour textes AR/HE longs

---

## Formatage Intl — état réel

| Fonction | Utilisée dans |
|---|---|
| `formatAmount` | `Pricing.tsx` ✅ |
| `formatDateShort` | Disponible, non encore branchée sur pages internes |
| `formatNumber` | Disponible, non encore branchée |
| `formatPercent` | Disponible, non encore branchée |
| `formatCompact` | Disponible, non encore branchée |
| `formatDateRelative` | Disponible, non encore branchée |

---

## Corridors internationaux — état réel

- Clés i18n créées : France→Israël, France→UK, France→UAE, France→LATAM
- `BestAccessPanel` affiche corridor_score et corridor label
- `facilitator_match_scores` table contient `best_corridor`, `corridor_score`
- Mise en avant dans les dashboards : clés créées, branchement partiel

---

## Limitations honnêtes restantes

1. **hi, bn** : clés critiques uniquement (nav, hero, best_path) — fallback fr/en pour le reste
2. **Pages internes** (Dashboard, PassiveOS, Ops, WarRoom) : clés i18n créées mais composants non branchés systématiquement avec `useTranslation`
3. **Copy marketing profond** (FAQ détaillées landing, features items) : FR/EN complet, autres langues via fallback
4. **RTL visuel** : non testé page par page sur toutes les pages de l'app
5. **Checkout / Success / Onboarding** : non internationalisés dans ce chantier
6. **formatDateShort / formatNumber sur pages internes** : non encore branchés

---

## Ce qui ne doit jamais être présenté comme réel

- "Visiteurs landing" : non mesurable via DB native — pas de tracker analytics externe branché
- Clés hi/bn au-delà du minimum : fallback FR, pas de traduction complète

---

## Preuve de suppression finale

| Chaîne | État |
|---|---|
| `const moteur1Items = [` | **SUPPRIMÉ** de Pricing.tsx |
| `const moteur2Items = [` | **SUPPRIMÉ** de Pricing.tsx |
| `const apporteurIncludes = [` | **SUPPRIMÉ** de Pricing.tsx |
| `const faqItems` avec hardcodage FR | **SUPPRIMÉ** — remplacé par t() |
| `"Recevez vos premiers clients"` (hardcodé dans JSX) | **SUPPRIMÉ** — dans i18n.ts via hero_headline_1 |
| `"Simple, honnête, transparent."` (hardcodé dans JSX) | **SUPPRIMÉ** — dans i18n.ts via pricing_title |
| `"Pas de frais cachés."` (hardcodé dans JSX) | **SUPPRIMÉ** — dans i18n.ts via pricing_subtitle |
