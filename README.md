# 💇 Clipper Connect

> Application mobile de mise en relation entre clients et coiffeurs - "L'Uber de la coiffure"

## 🚀 Stack technique

- **Expo** 54.0.0 - Framework React Native
- **Expo Router** 6.0.17 - Navigation file-based
- **React Native** 0.81.5 - UI Mobile
- **TypeScript** 5.3.0 - Typage
- **Zustand** 4.5.0 - State management
- **Supabase** 2.39.0 - Backend (BDD, Auth, Storage)

## 📁 Structure du projet

```
clipper-connect/
├── app/                          # Routes (Expo Router)
│   ├── (auth)/                   # Authentification
│   │   ├── welcome.tsx           # Écran d'accueil
│   │   ├── login.tsx             # Connexion
│   │   ├── register.tsx          # Inscription
│   │   └── role-selection.tsx    # Choix du rôle
│   │
│   └── (app)/                    # App principale (connecté)
│       ├── (tabs)/               # Navigation tabs
│       │   ├── index.tsx         # Accueil (Feed + Coiffeurs)
│       │   ├── shop.tsx          # Boutique
│       │   ├── activity.tsx      # Mes réservations
│       │   └── profile.tsx       # Profil
│       │
│       ├── (shared)/             # Écrans partagés
│       │   ├── coiffeur/[id].tsx # Profil coiffeur
│       │   └── inspiration/[id].tsx
│       │
│       ├── (client)/             # Écrans client uniquement
│       │   └── booking/          # Flow de réservation
│       │
│       └── (pro)/                # Écrans coiffeur/salon
│           ├── dashboard.tsx     # Tableau de bord
│           ├── agenda.tsx        # Mes RDV
│           ├── clients.tsx       # Ma clientèle
│           └── ...
│
├── src/                          # Logique métier
│   ├── components/               # Composants React
│   │   ├── ui/                   # Composants génériques
│   │   ├── shared/               # Composants métier partagés
│   │   ├── layout/               # Composants de layout
│   │   └── pro/                  # Composants pro
│   │
│   ├── stores/                   # State management (Zustand)
│   ├── lib/                      # Connexions externes (Supabase)
│   ├── constants/                # Constantes et mock data
│   ├── types/                    # Types TypeScript
│   ├── hooks/                    # Hooks globaux
│   └── utils/                    # Utilitaires
│
└── assets/                       # Images, icônes
```

## 🏃 Démarrage rapide

```bash
# 1. Installer les dépendances
npm install

# 2. Configurer les variables d'environnement
cp .env.example .env
# Remplir les valeurs Supabase

# 3. Lancer le projet
npx expo start
```

## 📱 Rôles utilisateur

| Rôle | Description | Accès |
|------|-------------|-------|
| **Client** | Cherche et réserve des coiffeurs | Tabs + Booking |
| **Coiffeur** | Propose ses services en freelance | Tabs + Booking + Espace Pro |
| **Salon** | Gère un salon de coiffure | Tabs + Booking + Espace Pro |

> ⚠️ **Important** : Tous les utilisateurs sont aussi des clients ! Un coiffeur peut réserver chez un autre coiffeur.

## 🔑 Alias d'imports

```typescript
import { InspirationCard } from "@shared";
import { useAuthStore } from "@stores";
import { COIFFEURS } from "@constants/mockData";
import { formatDateToLocal } from "@utils";
```

| Alias | Chemin |
|-------|--------|
| `@components/*` | `src/components/*` |
| `@shared/*` | `src/components/shared/*` |
| `@layout/*` | `src/components/layout/*` |
| `@stores/*` | `src/stores/*` |
| `@lib/*` | `src/lib/*` |
| `@constants/*` | `src/constants/*` |
| `@types/*` | `src/types/*` |
| `@hooks/*` | `src/hooks/*` |
| `@utils/*` | `src/utils/*` |

## ⚠️ Règles importantes

### Gestion des dates
```typescript
// ❌ NE JAMAIS FAIRE
date.toISOString()

// ✅ TOUJOURS UTILISER
import { formatDateToLocal } from "@utils";
formatDateToLocal(date);
```

### Design system
- Couleurs : Noir / Blanc / Gris
- Pas de vert sur les boutons (sauf icône succès)
- Cards : borderRadius 14-16px
- Boutons principaux : fond noir, texte blanc

## 📋 TODO

- [ ] Intégration Supabase complète
- [ ] Paiement Stripe
- [ ] Notifications push
- [ ] Géolocalisation
- [ ] Chat client/coiffeur
- [ ] Espace Pro complet
