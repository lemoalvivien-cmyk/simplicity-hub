# INTERNATIONAL PREMIUM TRUTH — WIINUP MAX
Version: 2026-03-08 (rev 2 — core flows pass)

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
- ~280 clés par langue principale (fr, en) — dont clés onboarding, checkout, dashboards, passiveOS
- RTL auto : ar et he → `dir="rtl"` sur `<html>` via `setLanguage()` et init

---

## Couverture réelle par fichier/zone

| Fichier / Zone | État |
|---|---|
| `src/components/landing/HeroSection.tsx` | ✅ 100% useTranslation |
| `src/pages/Pricing.tsx` | ✅ 100% useTranslation + formatAmount |
| `src/components/graph/BestAccessPanel.tsx` | ✅ 100% useTranslation |
| `src/pages/Onboarding.tsx` | ✅ 100% useTranslation — tous les steps |
| `src/pages/Checkout.tsx` | ✅ 100% useTranslation + formatAmount |
| `src/pages/DashboardEntreprise.tsx` | ✅ 100% useTranslation + formatNumber |
| `src/pages/DashboardFacilitateur.tsx` | ✅ 100% useTranslation + formatNumber |
| `src/pages/PassiveOS.tsx` | ✅ 100% useTranslation + formatNumber |
| Nav (UserNav, PublicNav) | ✅ Partiellement via t() |
| Operations / WarRoom | ⚠️ Clés disponibles — pages non encore branchées |
| Admin pages | ✅ En français intentionnel (back-office admin = usage interne) |

---

## Chaînes hardcodées supprimées dans ce chantier (rev 2)

| Fichier | Chaîne supprimée |
|---|---|
| `src/pages/Onboarding.tsx` | Tous les steps (welcome, rôle, profil, action, fin) — ~40 chaînes FR |
| `src/pages/Checkout.tsx` | Tous les steps (choose, promo, payment, success) — ~30 chaînes FR |
| `src/pages/DashboardEntreprise.tsx` | Labels, KPIs, CTAs, sections, empty states — ~25 chaînes FR |
| `src/pages/DashboardFacilitateur.tsx` | Labels, KPIs, CTAs, sections, gains — ~25 chaînes FR |
| `src/pages/PassiveOS.tsx` | KPIs, tabs, canaux, channels, OpenClaw — ~20 chaînes FR |

---

## Support RTL — état réel

- `ar` et `he` : `dir="rtl"` appliqué sur `<html>` automatiquement
- Tailwind respecte `dir="rtl"` nativement (flex, text-align)
- Radix UI composants : support RTL natif via direction
- **Non testé visuellement page par page** — risque de débordement sur mobile pour textes AR/HE longs

---

## Formatage Intl — état réel

| Fonction | Utilisée dans |
|---|---|
| `formatAmount` | `Pricing.tsx` ✅, `Checkout.tsx` ✅ |
| `formatNumber` | `DashboardFacilitateur.tsx` ✅, `PassiveOS.tsx` ✅ |
| `formatDateShort` | Disponible, non encore branchée sur pages internes |
| `formatPercent` | Disponible, non encore branchée |
| `formatCompact` | Disponible, non encore branchée |
| `formatDateRelative` | Disponible, non encore branchée |

---

## Limitations honnêtes restantes

1. **hi, bn** : clés critiques uniquement (nav, hero, best_path) — fallback fr/en pour les nouvelles clés onboarding/checkout/dashboards
2. **Operations / WarRoom** : clés i18n créées, pages non encore branchées avec useTranslation
3. **RTL visuel** : non testé page par page sur toutes les pages de l'app
4. **formatDateShort / formatNumber sur pages internes** : non encore branchés sur Operations, WarRoom, Gains, etc.
5. **Sector options & Goal options dans Onboarding** : encore hardcodés en français (données business difficiles à traduire sans liste complète de traduction secteurs)
6. **Admin pages** : intentionnellement en français (back-office interne)

---

## Ce qui ne doit jamais être présenté comme réel

- "Visiteurs landing" : non mesurable via DB native — pas de tracker analytics externe branché
- Clés hi/bn au-delà du minimum : fallback FR, pas de traduction complète
- "RTL premium testé" : dir appliqué mais visuellement non audité page par page
