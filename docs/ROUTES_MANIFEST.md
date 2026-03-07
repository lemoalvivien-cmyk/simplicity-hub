# ROUTES MANIFEST
> Version: 2026-03-07 | Source: src/App.tsx (audité ligne par ligne)

---

## ROUTES PUBLIQUES

| Route | Page | Protection | Navigation | Usage |
|-------|------|-----------|-----------|-------|
| `/` | Index.tsx | Publique | PublicNav | Landing page |
| `/pricing` | Pricing.tsx | Publique | PublicNav | Tarification |
| `/checkout` | Checkout.tsx | Publique | — | Paiement Stripe |
| `/login` | Login.tsx | Publique | — | Connexion |
| `/signup` | Signup.tsx | Publique | — | Inscription |

---

## ROUTES PROTÉGÉES — ONBOARDING

| Route | Page | Protection | Navigation | Usage |
|-------|------|-----------|-----------|-------|
| `/onboarding` | Onboarding.tsx | ProtectedRoute | — | First-run flow |

---

## ROUTES PROTÉGÉES — DASHBOARDS

| Route | Page | Navigation | Usage |
|-------|------|-----------|-------|
| `/dashboard` | DashboardFacilitateur.tsx | UserNav | Alias facilitateur |
| `/dashboard/facilitateur` | DashboardFacilitateur.tsx | UserNav (Accueil) | Dashboard apporteur |
| `/dashboard/entreprise` | DashboardEntreprise.tsx | UserNav (Accueil) | Dashboard entreprise |
| `/pilotage` | Pilotage.tsx | UserNav (entreprise) + mobile avancé | Vue globale |

---

## ROUTES PROTÉGÉES — STUDIO & PROSPECTION

| Route | Page | Navigation | Usage |
|-------|------|-----------|-------|
| `/studio` | Studio.tsx | Mobile avancé | Builder |
| `/campagnes` | Campagnes.tsx | Mobile avancé | Campagnes |
| `/campagnes/nouvelle` | CampagneNouvelle.tsx | Via Campagnes | Créer campagne |
| `/campagnes/:id` | CampagneDetail.tsx | Via Campagnes | Détail campagne |
| `/sources` | Sources.tsx | — | Sources |
| `/messages` | Messages.tsx | — | Modèles |
| `/regles` | Regles.tsx | — | Règles |
| `/canaux` | Canaux.tsx | Mobile avancé | Configuration canaux |
| `/opportunites` | Opportunites.tsx | — | Pipeline |
| `/contacts` | Contacts.tsx | UserNav fac. + Mobile avancé | Contacts |
| `/contacts/import` | ContactImport.tsx | Via Contacts | Import CSV |
| `/contacts/:id` | ContactDetail.tsx | Via Contacts | Détail contact |
| `/listes` | Listes.tsx | — | Listes contacts |
| `/actions` | Actions.tsx | Mobile avancé | Tâches à faire |

---

## ROUTES PROTÉGÉES — APPORT D'AFFAIRES FACILITATEUR

| Route | Page | Navigation | Usage |
|-------|------|-----------|-------|
| `/missions` | Missions.tsx | UserNav core (fac. + ent.) | Missions |
| `/missions/nouvelle` | MissionNouvelle.tsx | Via Missions | Créer mission |
| `/missions/:id` | MissionDetail.tsx | Via Missions | Détail mission |
| `/introductions` | Introductions.tsx | UserNav core facilitateur | Introductions |
| `/introductions/:id` | IntroductionDetail.tsx | Via Introductions | Détail introduction |
| `/gains` | Gains.tsx | UserNav core facilitateur | Gains |
| `/profil/facilitateur` | ProfilFacilitateur.tsx | Mobile (Mon profil) | Profil public |

---

## ROUTES PROTÉGÉES — APPORT D'AFFAIRES ENTREPRISE

| Route | Page | Navigation | Usage |
|-------|------|-----------|-------|
| `/entreprise/introductions` | IntroductionsEntreprise.tsx | UserNav core entreprise | Introductions reçues |
| `/profil/entreprise` | ProfilEntreprise.tsx | Mobile (Mon profil) | Profil entreprise |

---

## ROUTES PROTÉGÉES — OPENCLAW

| Route | Page | Navigation | Usage |
|-------|------|-----------|-------|
| `/agents` | Agents.tsx | UserNav avancé (niveau 1) | Agent OS |
| `/dossier` | Dossier.tsx | — (URL directe) | Dossier stratégique |
| `/validations` | Validations.tsx | Mobile avancé | Validations AI |
| `/operations` | Operations.tsx | Mobile avancé + /agents | Runtime complet |
| `/war-room` | WarRoom.tsx | Mobile avancé | Commandement |

---

## ROUTES PROTÉGÉES — DEAL RADAR & RÉSEAU

| Route | Page | Navigation | Usage |
|-------|------|-----------|-------|
| `/radar` | Radar.tsx | UserNav avancé (niveau 1) | Deal Radar |
| `/reseau` | Reseau.tsx | Mobile avancé | Business graph |
| `/import-reseau` | ImportReseau.tsx | Mobile avancé | Import réseau |

---

## ROUTES PROTÉGÉES — PASSIVE OS & MARKETPLACE

| Route | Page | Navigation | Usage |
|-------|------|-----------|-------|
| `/passive` | PassiveOS.tsx | UserNav avancé fac. (niveau 1) | Mode passif |
| `/offres` | Offres.tsx | Mobile avancé fac. | Offres à partager |
| `/offres/entreprise` | OffresEntreprise.tsx | Mobile avancé ent. | Offres entreprise |
| `/chaud` | Chaud.tsx | Mobile avancé | Ce qui chauffe |
| `/facilitateurs` | Facilitateurs.tsx | Mobile avancé ent. | Marketplace |
| `/facilitateurs/:id` | FacilitateurDetail.tsx | Via Facilitateurs | Profil facilitateur |

---

## ROUTES PROTÉGÉES — TRUST & SIGNALEMENT

| Route | Page | Navigation | Usage |
|-------|------|-----------|-------|
| `/trust` | Trust.tsx | Mobile avancé | Trust engine |
| `/signalement` | Signalement.tsx | Mobile (Signaler) | Signalement |

---

## ROUTES PROTÉGÉES — UTILITAIRES

| Route | Page | Navigation | Usage |
|-------|------|-----------|-------|
| `/assistant` | Assistant.tsx | — | Copilot IA |
| `/help` | Help.tsx | Nav (HelpCircle) | Aide |
| `/account` | Account.tsx | — | Compte |
| `/install` | Install.tsx | Mobile avancé | PWA guide |
| `/autonomie` | Autonomie.tsx | — | Niveau autonomie |
| `/system-proof` | SystemProof.tsx | Admin + /operations | Source of truth UI |

---

## ROUTES ADMIN (adminOnly)

| Route | Page | Protection | Usage |
|-------|------|-----------|-------|
| `/admin` | admin/Overview.tsx | ProtectedRoute adminOnly | Overview |
| `/admin/users` | admin/Users.tsx | ProtectedRoute adminOnly | Utilisateurs |
| `/admin/promo-codes` | admin/PromoCodes.tsx | ProtectedRoute adminOnly | Codes promo |
| `/admin/payments` | admin/Payments.tsx | ProtectedRoute adminOnly | Paiements |
| `/admin/help` | admin/HelpContent.tsx | ProtectedRoute adminOnly | Contenu aide |
| `/admin/analytics` | admin/Analytics.tsx | ProtectedRoute adminOnly | Analytics |

---

## ROUTES FANTÔMES / ABSENTES DE LA NAVIGATION

Ces routes existent dans `App.tsx` mais n'ont pas d'entrée directe dans la nav principale :
- `/dossier` — accessible via `/agents` ou URL directe
- `/autonomie` — URL directe
- `/assistant` — URL directe
- `/account` — URL directe
- `/system-proof` — accessible depuis admin ou `/operations`
- `/sources`, `/messages`, `/regles`, `/opportunites`, `/listes` — URL directe

---

## ROUTES 404

Route `*` → `NotFound.tsx`
