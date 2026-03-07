# INTERNATIONAL PREMIUM TRUTH — WIINUP MAX
Version: 2026-03-07

## Langues déclarées (10)
fr · en · es · pt · ru · zh · hi · bn · ar · he

## État avant ce chantier
- ~30 clés i18n superficielles (nav labels uniquement)
- Pages critiques 100% hardcodées en français
- RTL déclaré dans setLanguage() mais non appliqué aux composants
- Aucun formatage Intl pour dates / montants / nombres

## Ce qui a été fait

### i18n.ts — clés massivamente étendues (~150 clés par langue principale)
Zones couvertes :
- Landing / Hero (headline, subtitle, CTAs, trust bar, steps)
- Pricing (labels, montants, badges, CTAs, FAQ titre)
- Corridors internationaux (France→Israël, France→UK, France→UAE, France→LATAM)
- Marketplace facilitateurs (titre, sous-titre, filtres, search placeholder)
- BestAccessPanel (loading, empty, scores, dimensions, alternatives)
- Dashboard entreprise & facilitateur (cockpit labels, métriques clés)
- PassiveOS (canaux, statuts)
- Operations / WarRoom (titres)
- GoLive / Admin (statuts ready/partial/env-dependent)
- Statuts génériques (active, pending, validated, expired, canceled)

### Fichiers créés/modifiés
| Fichier | Action |
|---|---|
| src/lib/i18n.ts | Massif — 10 langues × ~150 clés |
| src/lib/formatLocale.ts | CRÉÉ — Intl formatting (amount, number, percent, date, relative, compact) |
| src/hooks/useRTL.ts | CRÉÉ — hook RTL (redondant avec i18n.ts qui le gère déjà) |
| src/components/landing/HeroSection.tsx | INTERNATIONALISÉ — useTranslation sur tous les textes |
| src/pages/Pricing.tsx | INTERNATIONALISÉ — useTranslation + formatAmount() |
| src/components/graph/BestAccessPanel.tsx | INTERNATIONALISÉ — useTranslation sur tous les labels |

### RTL
- Déjà géré par setLanguage() et l'init dans i18n.ts via document.documentElement.setAttribute("dir", ...)
- ar et he déclenchent dir="rtl" automatiquement à l'init et au changement de langue
- CSS Tailwind respecte `dir="rtl"` nativement pour flex/text direction

### Formatage Intl
- formatAmount(value, lang) — monnaie localisée
- formatNumber(value, lang) — séparateurs locaux
- formatPercent(value, lang) — pourcentage localisé
- formatDateShort(date, lang) — date courte
- formatDateRelative(date, lang) — date relative (il y a 3 jours...)
- formatCompact(value, lang) — nombre abrégé (1.2K)

## Couverture actuelle par zone

| Zone | État |
|---|---|
| Landing Hero | ✅ Internationalisé |
| Pricing page | ✅ Internationalisé + formatAmount |
| BestAccessPanel | ✅ Internationalisé |
| Nav (UserNav, PublicNav) | ✅ Déjà partiellement via t() |
| DashboardEntreprise | ⚠️ Partiellement — clés ajoutées, branchement t() non systématique |
| DashboardFacilitateur | ⚠️ Partiellement — clés ajoutées, branchement t() non systématique |
| PassiveOS | ⚠️ Clés i18n disponibles, pages encore majoritairement hardcodées |
| Operations / WarRoom | ⚠️ Clés disponibles, pages non encore branchées |
| Admin pages | ✅ En français intentionnel (back-office admin = usage interne) |
| Onboarding | ⚠️ Non encore internationalisé |
| Checkout / Success | ⚠️ Non encore internationalisé |

## Corridors internationaux — état
- Clés i18n créées : France→Israël, France→UK, France→UAE, France→LATAM
- Affichés dans le matching engine via explanation pills (données réelles du graphe)
- Marketplace facilitateurs : colonnes languages + business_corridors déjà présentes dans la data
- Mise en avant corridor dans BestAccessPanel : score corridor visible et labelisé

## RTL — état honnête
- ar et he : dir="rtl" appliqué au <html> → les layouts flex Tailwind s'adaptent
- Pas de test visuel systématique sur chaque page en RTL
- Composants complexes (tableaux, dropdowns Radix) : le support RTL natif de Tailwind + Radix couvre l'essentiel
- Textes très longs en arabe/hébreu dans les cartes : risque de débordement sur mobile non vérifié

## Limitations honnêtes restantes
- Traductions partielles pour hi, bn (clés critiques uniquement, fallback fr pour le reste)
- Pages internes (Dashboard, PassiveOS, Operations, WarRoom) : clés i18n créées mais non toutes branchées avec useTranslation
- Copy marketing profond (ex: features items, FAQ détaillées) : reste en français → fallback fr
- Trafic landing (visitors) : non mesurable via DB native
- Checkout / Success : non internationalisé dans ce chantier
- Test RTL visuel sur toutes les pages : non fait

## Ce qui dépend de la data
- Corridors recommandés : dépendent des données réelles graph_edges / facilitator_match_scores
- Langue recommandée : dépend du profil facilitateur et du dossier entreprise
- Best path : dépend de vrais facilitateurs avec scores calculés
