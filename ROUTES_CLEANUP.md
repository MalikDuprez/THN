# 🧹 NETTOYAGE DES ROUTES - RÉSUMÉ

## ✅ Fichier centralisé créé

**`src/constants/routes.ts`** - Toutes les routes de l'application

### Structure
```typescript
ROUTES = {
  AUTH: { WELCOME, LOGIN, REGISTER, ROLE_SELECTION }
  CLIENT: { HOME, SALON, ACTIVITY, PROFILE, BOOKING: {...} }
  PRO: { DASHBOARD, AGENDA, VITRINE, PROFILE, ... }
  SHARED: { COIFFEUR(id), INSPIRATION(id), SETTINGS, FAVORITES, ... }
}
```

---

## 📁 21 fichiers mis à jour

### Auth (4 fichiers)
| Fichier | Routes migrées |
|---------|----------------|
| `welcome.tsx` | ROLE_SELECTION, REGISTER, LOGIN |
| `login.tsx` | REGISTER |
| `register.tsx` | ROLE_SELECTION, LOGIN |
| `role-selection.tsx` | CLIENT.HOME, PRO.DASHBOARD |

### App Layouts (2 fichiers)
| Fichier | Routes migrées |
|---------|----------------|
| `app/index.tsx` | CLIENT.HOME |
| `(app)/_layout.tsx` | AUTH.WELCOME |

### Client Tabs (3 fichiers)
| Fichier | Routes migrées |
|---------|----------------|
| `(tabs)/index.tsx` | SHARED.INSPIRATION, SHARED.COIFFEUR, NOTIFICATIONS |
| `(tabs)/activity.tsx` | CLIENT.HOME |
| `(tabs)/profile.tsx` | AUTH.WELCOME, SETTINGS, FAVORITES.*, ACCOUNT.*, PRO.DASHBOARD |

### Booking Flow (3 fichiers)
| Fichier | Routes migrées |
|---------|----------------|
| `booking/service.tsx` | (import ajouté) |
| `booking/confirm.tsx` | CLIENT.ACTIVITY |
| `booking/checkout.tsx` | CLIENT.ACTIVITY |

### Pro (4 fichiers)
| Fichier | Routes migrées |
|---------|----------------|
| `dashboard.tsx` | CLIENT.SALON, SETTINGS, PRO.AGENDA, PRO.MESSAGES |
| `profile-pro.tsx` | PRO.SETTINGS |
| `settings-pro.tsx` | AUTH.LOGIN, CLIENT.HOME |
| `portfolio/index.tsx` | PRO.PORTFOLIO_ADD |

### Shared (5 fichiers)
| Fichier | Routes migrées |
|---------|----------------|
| `settings.tsx` | SETTINGS.*, HELP.*, LEGAL.* |
| `coiffeur/[id].tsx` | CLIENT.BOOKING.SERVICE |
| `inspiration/[id].tsx` | SHARED.COIFFEUR, CLIENT.BOOKING.SERVICE |
| `favorites/coiffeurs.tsx` | SHARED.COIFFEUR |
| `favorites/inspirations.tsx` | SHARED.INSPIRATION |

---

## 🔧 Avantages du nouveau système

### 1. Autocomplétion TypeScript
```typescript
router.push(ROUTES.CLIENT.HOME); // ✅ Typé
router.push("/(app)/(tabs)/");   // ❌ String magique
```

### 2. Refactoring sécurisé
Si une route change, une seule modification dans `routes.ts`

### 3. Routes dynamiques typées
```typescript
ROUTES.SHARED.COIFFEUR(id);     // /(app)/(shared)/coiffeur/123
ROUTES.SHARED.INSPIRATION(id);  // /(app)/(shared)/inspiration/456
```

### 4. Documentation intégrée
Le fichier `routes.ts` documente toute la navigation de l'app

---

## 📋 Prochaines étapes pour la BDD

### 1. Créer `src/api/` avec :
```
src/api/
├── auth.ts         # signIn, signUp, signOut
├── bookings.ts     # CRUD réservations
├── coiffeurs.ts    # getCoiffeurs, getById
├── inspirations.ts # getInspirations
├── services.ts     # getServices
├── favorites.ts    # addFavorite, removeFavorite
└── notifications.ts
```

### 2. Générer les types Supabase
```bash
npx supabase gen types typescript --project-id YOUR_PROJECT > src/types/database.ts
```

### 3. Connecter les écrans
Remplacer les imports de `mockData.ts` par les appels API :

```typescript
// Avant
import { COIFFEURS } from "@/constants/mockData";

// Après
import { useCoiffeurs } from "@/hooks/useCoiffeurs";
const { data: coiffeurs, isLoading } = useCoiffeurs();
```

---

## 🗄️ Mapping Routes → API

| Route | Endpoint API | Table Supabase |
|-------|-------------|----------------|
| `CLIENT.HOME` | `GET /inspirations` | inspirations |
| `CLIENT.ACTIVITY` | `GET /bookings?client_id=me` | bookings |
| `SHARED.COIFFEUR(id)` | `GET /coiffeurs/:id` | coiffeurs, services |
| `CLIENT.BOOKING.*` | `POST /bookings` | bookings |
| `PRO.DASHBOARD` | `GET /bookings?coiffeur_id=me` | bookings |
| `FAVORITES.*` | `GET /favorites?user_id=me` | favorites |
