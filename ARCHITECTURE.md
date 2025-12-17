# 🏗️ ARCHITECTURE CLIPPER-CONNECT

## 📋 Vue d'ensemble

TapeHair/Clipper-Connect est une app de mise en relation client-coiffeur avec:
- **Mode Client** : Découvrir, réserver, payer
- **Mode Pro** : Gérer RDV, revenus, vitrine

---

## 🗂️ STRUCTURE DES ROUTES

```
app/
├── _layout.tsx              # Root - SafeArea + Stack
├── index.tsx                # Redirect → /(app)/(tabs)
│
├── (auth)/                  # 🔐 NON AUTHENTIFIÉ
│   ├── _layout.tsx          # Stack sans header
│   ├── welcome.tsx          # Landing page + mode démo
│   ├── login.tsx            # Connexion
│   ├── register.tsx         # Inscription  
│   └── role-selection.tsx   # Choix client/coiffeur/salon
│
└── (app)/                   # 🔒 AUTHENTIFIÉ (guard dans _layout)
    ├── _layout.tsx          # Stack + redirect si non auth
    │
    ├── (tabs)/              # 📱 TABS CLIENT (4 onglets)
    │   ├── _layout.tsx      # TabBar custom
    │   ├── index.tsx        # Accueil - Feed inspirations
    │   ├── salon.tsx        # Shop - Services & Produits
    │   ├── activity.tsx     # Activité - Mes RDV
    │   └── profile.tsx      # Profil - Mon compte
    │
    ├── (client)/            # 🛒 FLOW RÉSERVATION
    │   └── booking/
    │       ├── _layout.tsx  # Stack booking
    │       ├── service.tsx  # Étape 1: Choix service
    │       ├── date.tsx     # Étape 2: Choix date
    │       ├── time.tsx     # Étape 3: Choix heure
    │       ├── confirm.tsx  # Étape 4: Récap + paiement
    │       └── checkout.tsx # (legacy, peut être supprimé)
    │
    ├── (pro)/               # 💼 MODE PROFESSIONNEL
    │   ├── _layout.tsx      # Stack pro
    │   ├── (tabs)/          # Tabs pro (4 onglets)
    │   │   ├── _layout.tsx
    │   │   ├── dashboard.tsx    # Tableau de bord
    │   │   ├── agenda.tsx       # Calendrier RDV
    │   │   ├── vitrine.tsx      # Ma vitrine publique
    │   │   └── profile-pro.tsx  # Profil pro
    │   │
    │   ├── clients.tsx      # Liste clients
    │   ├── earnings.tsx     # Revenus & stats
    │   ├── messages.tsx     # Messagerie
    │   ├── settings-pro.tsx # Paramètres pro
    │   ├── portfolio/       # Gestion photos
    │   │   ├── index.tsx
    │   │   └── add.tsx
    │   └── services/        # Gestion services
    │       ├── index.tsx
    │       └── [id].tsx
    │
    └── (shared)/            # 🔗 PAGES PARTAGÉES
        ├── settings.tsx         # Paramètres généraux
        ├── notifications.tsx    # Notifications
        ├── coiffeur/[id].tsx    # Profil coiffeur public
        ├── inspiration/[id].tsx # Détail inspiration
        │
        ├── settings/        # Sous-pages paramètres
        │   ├── notifications.tsx
        │   ├── language.tsx
        │   └── appearance.tsx
        │
        ├── help/            # Aide
        │   ├── center.tsx
        │   └── contact.tsx
        │
        ├── legal/           # Légal
        │   ├── terms.tsx
        │   └── privacy.tsx
        │
        ├── favorites/       # Favoris
        │   ├── coiffeurs.tsx
        │   ├── salons.tsx
        │   └── inspirations.tsx
        │
        └── account/         # Mon compte
            ├── personal-info.tsx
            ├── payment-methods.tsx
            └── addresses.tsx
```

---

## 🗄️ SCHÉMA BASE DE DONNÉES (Supabase)

### Tables principales

```sql
-- 👤 UTILISATEURS
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  role TEXT CHECK (role IN ('client', 'coiffeur', 'salon')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 💇 COIFFEURS (extension de profiles)
CREATE TABLE coiffeurs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  salon_name TEXT,
  specialty TEXT,
  bio TEXT,
  hourly_rate DECIMAL(10,2),
  at_home BOOLEAN DEFAULT false,
  is_available BOOLEAN DEFAULT true,
  rating DECIMAL(2,1) DEFAULT 0,
  reviews_count INTEGER DEFAULT 0,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 🏪 SALONS (si role = salon)
CREATE TABLE salons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  address TEXT,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  phone TEXT,
  opening_hours JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ✂️ SERVICES
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coiffeur_id UUID REFERENCES coiffeurs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  category TEXT, -- 'coupe', 'coloration', 'soin', etc.
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 📅 RÉSERVATIONS
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES profiles(id),
  coiffeur_id UUID REFERENCES coiffeurs(id),
  service_id UUID REFERENCES services(id),
  
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  
  location_type TEXT CHECK (location_type IN ('salon', 'domicile')),
  address TEXT, -- adresse si domicile
  
  base_price DECIMAL(10,2) NOT NULL,
  service_fee DECIMAL(10,2) DEFAULT 0, -- frais déplacement
  total_price DECIMAL(10,2) NOT NULL,
  
  status TEXT CHECK (status IN (
    'pending', 'confirmed', 'hairdresser_coming', 
    'in_progress', 'completed', 'cancelled'
  )) DEFAULT 'pending',
  
  cancelled_by TEXT, -- 'client' ou 'coiffeur'
  cancellation_reason TEXT,
  
  payment_status TEXT CHECK (payment_status IN (
    'pending', 'paid', 'refunded'
  )) DEFAULT 'pending',
  payment_intent_id TEXT, -- Stripe
  
  rated BOOLEAN DEFAULT false,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  review TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 🎨 INSPIRATIONS (galerie publique)
CREATE TABLE inspirations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coiffeur_id UUID REFERENCES coiffeurs(id),
  title TEXT NOT NULL,
  image_url TEXT NOT NULL,
  category TEXT, -- 'feminin', 'masculin', 'couleur', etc.
  tags TEXT[], -- ['balayage', 'blond', 'long']
  duration_estimate TEXT,
  price_estimate DECIMAL(10,2),
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ❤️ FAVORIS
CREATE TABLE favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  target_type TEXT CHECK (target_type IN ('coiffeur', 'salon', 'inspiration')),
  target_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, target_type, target_id)
);

-- 📍 ADRESSES (clients)
CREATE TABLE addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  label TEXT, -- 'Domicile', 'Bureau'
  address_line TEXT NOT NULL,
  city TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 💳 MOYENS DE PAIEMENT
CREATE TABLE payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  stripe_payment_method_id TEXT NOT NULL,
  card_brand TEXT, -- 'visa', 'mastercard'
  card_last4 TEXT,
  card_exp_month INTEGER,
  card_exp_year INTEGER,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 🔔 NOTIFICATIONS
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'booking', 'reminder', 'promo', 'message'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB, -- données additionnelles (booking_id, etc.)
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 📊 DISPONIBILITÉS (coiffeurs)
CREATE TABLE availabilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coiffeur_id UUID REFERENCES coiffeurs(id) ON DELETE CASCADE,
  day_of_week INTEGER CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Dimanche
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_active BOOLEAN DEFAULT true
);

-- 🚫 INDISPONIBILITÉS (vacances, etc.)
CREATE TABLE blocked_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coiffeur_id UUID REFERENCES coiffeurs(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  all_day BOOLEAN DEFAULT false,
  reason TEXT
);
```

---

## 🔄 MAPPING ROUTES → DONNÉES

| Route | Données requises | Table(s) |
|-------|------------------|----------|
| `/(tabs)/index` | Inspirations, Coiffeurs | `inspirations`, `coiffeurs` |
| `/(tabs)/salon` | Services, Produits | `services`, (products à créer) |
| `/(tabs)/activity` | Mes réservations | `bookings` (WHERE client_id = me) |
| `/(tabs)/profile` | Mon profil, stats | `profiles`, `bookings` |
| `/coiffeur/[id]` | Profil coiffeur, services, avis | `coiffeurs`, `services`, `bookings` |
| `/inspiration/[id]` | Détail inspiration | `inspirations` |
| `/booking/*` | Service, coiffeur, disponibilités | `services`, `availabilities`, `blocked_slots` |
| `/(pro)/dashboard` | Stats, RDV du jour | `bookings` (WHERE coiffeur_id = me) |
| `/(pro)/agenda` | Calendrier | `bookings`, `availabilities` |
| `/(pro)/clients` | Liste clients | `bookings` → `profiles` |
| `/(pro)/earnings` | Revenus | `bookings` (completed, paid) |
| `/favorites/*` | Favoris | `favorites` |
| `/account/*` | Adresses, paiements | `addresses`, `payment_methods` |
| `/notifications` | Notifications | `notifications` |

---

## 📁 STRUCTURE SRC PROPOSÉE

```
src/
├── api/                     # 🔌 Appels Supabase
│   ├── auth.ts              # signIn, signUp, signOut
│   ├── bookings.ts          # CRUD bookings
│   ├── coiffeurs.ts         # getCoiffeurs, getById
│   ├── inspirations.ts      # getInspirations
│   ├── services.ts          # getServices
│   ├── favorites.ts         # addFavorite, removeFavorite
│   ├── notifications.ts     # getNotifications, markRead
│   └── index.ts             # Export all
│
├── stores/                  # 🗃️ État local (Zustand)
│   ├── authStore.ts         # User, isAuth (simplifié)
│   ├── bookingStore.ts      # CurrentBooking (flow checkout)
│   ├── cartStore.ts         # Panier produits (si shop)
│   └── index.ts
│
├── hooks/                   # 🪝 Hooks custom
│   ├── useAuth.ts           # Raccourci authStore
│   ├── useBookings.ts       # Query bookings
│   ├── useCoiffeurs.ts      # Query coiffeurs
│   └── index.ts
│
├── types/                   # 📝 Types TypeScript
│   ├── database.ts          # Types générés par Supabase
│   ├── models.ts            # Types métier (Booking, User, etc.)
│   └── index.ts
│
├── constants/               # 📊 Constantes
│   ├── routes.ts            # Chemins centralisés
│   ├── theme.ts             # Couleurs, spacing
│   └── index.ts
│
├── lib/                     # 🔧 Config
│   └── supabase/
│       ├── client.ts        # createClient
│       └── index.ts
│
├── components/              # 🧩 Composants
│   ├── ui/                  # Primitifs (Button, Input, Card)
│   ├── shared/              # Métier (CoiffeurCard, BookingCard)
│   ├── layout/              # TabBar, Header
│   └── index.ts
│
└── utils/                   # 🛠️ Utilitaires
    ├── date.ts              # Formatage dates
    ├── price.ts             # Formatage prix
    └── index.ts
```

---

## 🛣️ FICHIER ROUTES CENTRALISÉ

```typescript
// src/constants/routes.ts

export const ROUTES = {
  // Auth
  auth: {
    welcome: "/(auth)/welcome",
    login: "/(auth)/login",
    register: "/(auth)/register",
    roleSelection: "/(auth)/role-selection",
  },
  
  // Client tabs
  tabs: {
    home: "/(app)/(tabs)/",
    salon: "/(app)/(tabs)/salon",
    activity: "/(app)/(tabs)/activity",
    profile: "/(app)/(tabs)/profile",
  },
  
  // Booking flow
  booking: {
    service: "/(app)/(client)/booking/service",
    date: "/(app)/(client)/booking/date",
    time: "/(app)/(client)/booking/time",
    confirm: "/(app)/(client)/booking/confirm",
  },
  
  // Pro tabs
  pro: {
    dashboard: "/(app)/(pro)/(tabs)/dashboard",
    agenda: "/(app)/(pro)/(tabs)/agenda",
    vitrine: "/(app)/(pro)/(tabs)/vitrine",
    profilePro: "/(app)/(pro)/(tabs)/profile-pro",
    clients: "/(app)/(pro)/clients",
    earnings: "/(app)/(pro)/earnings",
    messages: "/(app)/(pro)/messages",
    settingsPro: "/(app)/(pro)/settings-pro",
    portfolio: "/(app)/(pro)/portfolio",
    portfolioAdd: "/(app)/(pro)/portfolio/add",
    services: "/(app)/(pro)/services",
  },
  
  // Shared (avec params dynamiques)
  shared: {
    coiffeur: (id: string) => `/(app)/(shared)/coiffeur/${id}`,
    inspiration: (id: string) => `/(app)/(shared)/inspiration/${id}`,
    settings: "/(app)/(shared)/settings",
    notifications: "/(app)/(shared)/notifications",
  },
  
  // Settings
  settings: {
    notifications: "/(app)/(shared)/settings/notifications",
    language: "/(app)/(shared)/settings/language",
    appearance: "/(app)/(shared)/settings/appearance",
  },
  
  // Help
  help: {
    center: "/(app)/(shared)/help/center",
    contact: "/(app)/(shared)/help/contact",
  },
  
  // Legal
  legal: {
    terms: "/(app)/(shared)/legal/terms",
    privacy: "/(app)/(shared)/legal/privacy",
  },
  
  // Favorites
  favorites: {
    coiffeurs: "/(app)/(shared)/favorites/coiffeurs",
    salons: "/(app)/(shared)/favorites/salons",
    inspirations: "/(app)/(shared)/favorites/inspirations",
  },
  
  // Account
  account: {
    personalInfo: "/(app)/(shared)/account/personal-info",
    paymentMethods: "/(app)/(shared)/account/payment-methods",
    addresses: "/(app)/(shared)/account/addresses",
  },
} as const;

// Helper pour typer les routes
export type AppRoute = typeof ROUTES;
```

---

## ✅ PLAN DE NETTOYAGE

### Phase 1: Centraliser les routes
- [ ] Créer `src/constants/routes.ts`
- [ ] Remplacer toutes les strings de routes par `ROUTES.xxx`
- [ ] Supprimer les routes dupliquées/mortes

### Phase 2: Nettoyer les types
- [ ] Générer les types Supabase: `npx supabase gen types typescript`
- [ ] Aligner `src/types/index.ts` avec le schéma BDD
- [ ] Supprimer les types inutilisés

### Phase 3: Restructurer les API
- [ ] Créer `src/api/` avec un fichier par entité
- [ ] Migrer les appels Supabase de authStore vers api/auth.ts
- [ ] Simplifier les stores (état local uniquement)

### Phase 4: Nettoyer les mockData
- [ ] Identifier ce qui reste en mock vs BDD
- [ ] Créer des seeders pour peupler la BDD de test
- [ ] Supprimer `mockData.ts` quand plus nécessaire

### Phase 5: Supprimer le code mort
- [ ] `booking/checkout.tsx` (doublon de confirm.tsx)
- [ ] Imports inutilisés
- [ ] Styles non utilisés

---

## 🎯 PROCHAINES ÉTAPES

1. **Valider ce schéma** avec toi
2. **Créer les tables Supabase** (je peux générer le SQL complet)
3. **Créer `src/constants/routes.ts`** et migrer
4. **Créer `src/api/`** avec les fonctions CRUD
5. **Connecter les écrans** un par un

Tu veux que je commence par quelle étape ?
