# Plan d'Action - Interface Web pour API OtoMusik

## Vue d'ensemble
Développement d'une interface web moderne pour gérer l'API OtoMusik avec Next.js, TypeScript et TailwindCSS.

## Technologies choisies
- **Frontend Framework**: Next.js 14 (App Router)
- **Langage**: TypeScript
- **Styling**: TailwindCSS + Headless UI
- **État global**: Zustand
- **API Client**: Fetch API avec types générés
- **WebSocket**: Socket.io-client
- **Icons**: Heroicons
- **Build Tool**: Turbopack (Next.js)

## Architecture du projet

```
src/
├── app/                    # App Router (Next.js 14)
│   ├── globals.css
│   ├── layout.tsx
│   ├── page.tsx
│   └── video/             # Routes pour otovideodb
│       ├── channels/
│       └── videos/
│
├── components/            # Composants réutilisables
│   ├── ui/               # Composants UI de base
│   ├── tables/           # Composants de tableaux
│   ├── filters/          # Composants de filtrage
│   └── layout/           # Navigation, header, etc.
├── lib/                  # Utilitaires et configuration
│   ├── api.ts           # Client API
│   ├── types.ts         # Types TypeScript
│   ├── utils.ts         # Fonctions utilitaires
│   └── websocket.ts     # Configuration WebSocket
├── hooks/               # Custom hooks
└── stores/              # Stores Zustand
```

## Étapes d'implémentation

### Phase 1: Setup et configuration (Jour 1)

#### 1.1 Initialisation du projet
```bash
# Créer le projet Next.js
npx create-next-app@latest otomusik-web --typescript --tailwind --app --use-npm
cd otomusik-web

# Installer les dépendances
npm install zustand @headlessui/react @heroicons/react socket.io-client clsx tailwind-merge
npm install -D @types/node
```

#### 1.2 Configuration TailwindCSS
```bash
# Ajouter des plugins utiles
npm install -D @tailwindcss/forms @tailwindcss/typography
```

#### 1.3 Structure de base des dossiers
```bash
mkdir -p src/{components/{ui,tables,filters,layout},lib,hooks,stores}
mkdir -p src/app/{music/{releases,channels,videos,playlists},video/{channels,videos,playlists}}
```

### Phase 2: Types et API Client (Jour 1-2)

#### 2.1 Générer les types TypeScript depuis l'OpenAPI
```typescript
// src/lib/types.ts
// Créer les interfaces basées sur le schéma OpenAPI
export interface PlaylistSchema {
  id?: number | null;
  url?: string | null;
  topic?: string | null;
  resolution?: string | null;
  status?: string | null;
  name?: string | null;
  // ... tous les autres champs
}

// Types pour les réponses API
export interface ApiResponse<T> {
  data: T[];
  total: number;
}

// Types pour les filtres
export interface FilterParams {
  limit?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  [key: string]: any;
}
```

#### 2.2 Client API avec types
```typescript
// src/lib/api.ts
import { ReleaseSchema, PlaylistSchema, VideoSchema, ChannelSchema, FilterParams } from './types';

export class ApiClient {
  private baseUrl: string;
  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  }
  
  async get<T>(endpoint: string, params?: FilterParams): Promise<T[]> {
    // Implémentation avec fetch
  }
  
  async patch<T>(endpoint: string, data: Partial<T>): Promise<T> {
    // Implémentation pour PATCH
  }
  
  async post<T>(endpoint: string, data: T): Promise<T> {
    // Implémentation pour POST
  }
  
  async delete(endpoint: string): Promise<void> {
    // Implémentation pour DELETE
  }
}

// Exemple d'utilisation typée :
const api = new ApiClient();

// Récupérer les playlists vidéo
const playlists: PlaylistSchema[] = await api.get<PlaylistSchema>('/api/video/playlists/');

// Mettre à jour le statut d'une release
await api.patch<ReleaseSchema>(`/api/music/releases/123`, { status: 'done' });

// Exporter une instance par défaut
export const apiClient = new ApiClient();
```

### Phase 3: Stores et état global (Jour 2)

#### 3.1 Store principal avec Zustand
```typescript
// src/stores/useAppStore.ts
interface AppState {
  darkMode: boolean;
  toggleDarkMode: () => void;
  
  // Messages
  message: { type: 'success' | 'error'; text: string } | null;
  setMessage: (message: AppState['message']) => void;
  clearMessage: () => void;
}

// src/stores/useDataStore.ts
interface DataState {
  // États pour chaque entité
  releases: ReleaseSchema[];
  channels: ChannelSchema[];
  videos: VideoSchema[];
  playlists: PlaylistSchema[];
  
  // États de chargement
  loading: Record<string, boolean>;
  
  // Filtres et tri
  filters: Record<string, FilterParams>;
  
  // Actions
  fetchData: (entity: string, db: 'music' | 'video') => Promise<void>;
  updateStatus: (entity: string, id: number, status: string) => Promise<void>;
}
```

### Phase 4: Composants UI de base (Jour 2-3)

#### 4.1 Composants UI réutilisables
```typescript
// src/components/ui/Button.tsx
// src/components/ui/Input.tsx
// src/components/ui/Select.tsx
// src/components/ui/Modal.tsx
// src/components/ui/Badge.tsx
// src/components/ui/Spinner.tsx
// src/components/ui/Tooltip.tsx
```

#### 4.2 Layout et navigation
```typescript
// src/components/layout/Navigation.tsx
// - Navigation principale avec liens vers Music/Video
// - Sous-navigation pour Releases, Channels, Videos, Playlists
// - Toggle mode sombre
// - Messages d'état

// src/components/layout/Header.tsx
// - Titre de la page
// - Bouton actualiser
// - Compteurs
```

### Phase 5: Composants de filtrage (Jour 3-4)

#### 5.1 Filtres avancés
```typescript
// src/components/filters/SearchFilter.tsx
// Recherche textuelle multi-champs

// src/components/filters/StatusFilter.tsx
// Sélection multiple de statuts

// src/components/filters/SortFilter.tsx
// Tri dynamique avec ordre

// src/components/filters/FilterBar.tsx
// Barre de filtres complète
```

### Phase 6: Tableaux de données (Jour 4-5)

#### 6.1 Composants de tableaux
```typescript
// src/components/tables/DataTable.tsx
// Tableau générique avec:
// - Tri des colonnes
// - Actions par ligne
// - Tooltip avec numéro de ligne
// - Modification inline

// src/components/tables/ReleasesTable.tsx
// src/components/tables/ChannelsTable.tsx
// src/components/tables/VideosTable.tsx
// src/components/tables/PlaylistsTable.tsx
```

#### 6.2 Actions sur les données
```typescript
// src/components/tables/StatusDropdown.tsx
// Menu déroulant pour changer statut

// src/components/tables/UrlEditor.tsx
// Édition inline d'URL

// src/components/tables/CopyButton.tsx
// Copie d'URL vers presse-papier
```

### Phase 7: Pages principales (Jour 5-6)

#### 7.1 Pages Music
```typescript
// src/app/music/releases/page.tsx
// src/app/music/channels/page.tsx
// src/app/music/videos/page.tsx
// src/app/music/playlists/page.tsx
```

#### 7.2 Pages Video
```typescript
// src/app/video/channels/page.tsx
// src/app/video/videos/page.tsx
// src/app/video/playlists/page.tsx
```

### Phase 8: WebSocket et temps réel (Jour 6)

#### 8.1 Configuration WebSocket
```typescript
// src/lib/websocket.ts
// Connexion et gestion des événements en temps réel

// src/hooks/useWebSocket.ts
// Hook pour utiliser WebSocket dans les composants
```

### Phase 9: Hooks personnalisés (Jour 6-7)

#### 9.1 Hooks utilitaires
```typescript
// src/hooks/useApi.ts
// Hook pour requêtes API avec cache et loading

// src/hooks/useFilters.ts
// Gestion des filtres et paramètres d'URL

// src/hooks/usePagination.ts
// Pagination des données

// src/hooks/useLocalStorage.ts
// Persistance des préférences
```

### Phase 10: Optimisations et finitions (Jour 7)

#### 10.1 Performance
- Lazy loading des composants
- Mémorisation avec useMemo/useCallback
- Debounce sur les recherches
- Cache des requêtes API

#### 10.2 UX/UI
- Animations avec Tailwind
- États de chargement
- Messages d'erreur informatifs
- Responsive design

## Commandes de développement

```bash
# Démarrer en développement
npm run dev

# Build de production
npm run build

# Démarrer en production
npm start

# Linting
npm run lint

# Tests (optionnel)
npm run test
```

## Variables d'environnement

```env
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000
```

## Points clés de l'implémentation

### Avantages de cette stack:
1. **Next.js 14**: App Router moderne, SSR/SSG, optimisations automatiques
2. **TypeScript**: Type safety, meilleure DX, refactoring sécurisé  
3. **TailwindCSS**: Styling rapide, design system cohérent, treeshaking
4. **Zustand**: Store simple et performant, moins de boilerplate que Redux
5. **Headless UI**: Composants accessibles, intégration Tailwind parfaite

### Performance:
- Lazy loading des routes
- Code splitting automatique
- Cache des requêtes API
- Debounce sur les recherches
- Mémorisation des calculs coûteux

### Maintenabilité:
- Types stricts partout
- Composants réutilisables
- Séparation claire des responsabilités
- Hooks personnalisés pour la logique métier
- Configuration centralisée

## Timeline estimée: 7 jours

- **Jour 1**: Setup + Types + API Client
- **Jour 2**: Stores + UI Components de base  
- **Jour 3**: Filtres + Layout
- **Jour 4**: Tableaux de données
- **Jour 5**: Pages principales
- **Jour 6**: WebSocket + Hooks avancés
- **Jour 7**: Optimisations + Finitions

Cette approche garantit une application moderne, performante et facile à maintenir avec toutes les fonctionnalités demandées.