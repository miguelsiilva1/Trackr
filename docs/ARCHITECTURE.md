# Arquitetura do TRACKR

## Visão geral

Monorepo com npm workspaces + Turborepo. Uma app Expo gera iOS, Android e Web a partir do mesmo código; a lógica de negócio vive num pacote TypeScript puro partilhado com o backend.

```
trackr/
├─ apps/
│  ├─ app/                 Expo SDK 58 + Expo Router (iOS · Android · Web)
│  │  └─ src/
│  │     ├─ app/           Rotas (cada ficheiro = ecrã). Só wrappers finos.
│  │     │  ├─ _layout.tsx         Providers, Stack raiz, toast, celebração de match
│  │     │  ├─ (tabs)/             Hub · Match · Feed · Perfil (sidebar ≥768px, tab bar <768px)
│  │     │  ├─ add.tsx             Modal "Track Item"
│  │     │  └─ item/[id].tsx       Modal de detalhe (deep link trackr://item/m1)
│  │     ├─ features/      UI por funcionalidade (hub, add, detail, match, feed, profile, shell)
│  │     ├─ components/    Primitivos partilhados (Poster, Sheet, Pill, StarRating…)
│  │     ├─ store/         Estado global (zustand + AsyncStorage) e conta (useAccount)
│  │     ├─ services/      Acesso ao Supabase (biblioteca na cloud)
│  │     ├─ providers/     i18n + tema (variáveis CSS do NativeWind)
│  │     ├─ hooks/         useMediaSearch, useAutoSync, useBreakpoint, useWebShortcuts
│  │     ├─ lib/           Ficheiros (files.ts nativo / files.web.ts browser), navegação
│  │     └─ theme/         Tokens de cor dark/light
│  └─ api/                 Hono (Node): OAuth com trackers externos + sync no servidor
│     └─ src/providers/    Um ProviderClient por serviço (mock, letterboxd…)
├─ packages/
│  ├─ core/                TS puro, sem React: domínio, i18n, adaptadores TMDB/RAWG,
│  │                       motor de sync (reconcile), CSV, mocks + testes (vitest)
│  └─ config/              tsconfig base partilhado
├─ supabase/migrations/    Esquema Postgres + RLS (perfis, amizades, biblioteca, feed, reações, votos)
└─ docs/
   ├─ ARCHITECTURE.md
   └─ prototype/TrackrApp.tsx   Protótipo original de ficheiro único (referência)
```

## Regras de dependência

```
apps/app ──► packages/core ◄── apps/api
```

- `packages/core` não importa React, React Native, Expo nem Node. Corre em qualquer lado e é testado isoladamente.
- `apps/app` e `apps/api` nunca se importam um ao outro.
- Ficheiros em `src/app/` (rotas) só importam um ecrã de `features/`. A lógica fica fora das rotas.
- Código específico de plataforma usa extensões do Metro: `files.ts` (iOS/Android) e `files.web.ts` (browser).

## Fluxo de dados

1. **Catálogo** — `MediaRepository.search` tenta TMDB/RAWG quando há chaves e cai sempre para o mock local em caso de erro, timeout ou CORS.
2. **Estado** — `useTrackr` (zustand) guarda biblioteca, feed, ligações e preferências. Persiste em AsyncStorage (localStorage na web).
3. **Sync** — `reconcile()` (em `core`) é uma função pura: recebe biblioteca local, biblioteca remota, ligação e devolve o novo estado de ambos + relatório. Hoje a app corre-a contra um remoto simulado; em produção corre em `apps/api`, que fala com cada serviço através de um `ProviderClient`.

## Backend (Supabase)

Contas, biblioteca na cloud e a parte social vivem no Supabase (Postgres + Auth + Realtime). A API Hono fica para o sync com trackers externos.

- **Sem backend** (`EXPO_PUBLIC_SUPABASE_*` vazios): a app corre só no dispositivo, como antes.
- **Com backend**: ao entrar, `mergeLibraries()` junta a biblioteca do dispositivo com a da cloud (ganha a versão mais recente de cada título); depois cada alteração local é enviada (`diffLibraries()`).
- **Permissões**: RLS em todas as tabelas. Cada utilizador vê as suas linhas e as dos amigos aceites (`can_see()`).

Configurar:

1. Criar um projeto em supabase.com.
2. Correr `supabase/migrations/*.sql` no SQL Editor (ou `supabase db push` com a CLI).
3. Copiar `apps/app/.env.example` para `apps/app/.env` com o Project URL e a publishable key.

## Adicionar um novo tracker (Trakt, Backloggd, TV Time…)

1. `packages/core/src/sync/providers.ts` — acrescentar um `ProviderDef` (e o id ao tipo `ProviderId`).
2. `apps/api/src/providers/` — implementar `ProviderClient` (`fetchLibrary`, `pushLibrary`).
3. Se o serviço tiver formato CSV próprio, tratar em `packages/core/src/sync/csv.ts`.

A UI do Perfil lista os providers automaticamente.

## Deploy

| Alvo | Como |
| --- | --- |
| Web | `npm run export:web -w @trackr/app` → `apps/app/dist` (estático: Vercel, Netlify, Cloudflare Pages) |
| iOS / Android | EAS Build (`npx eas-cli@latest build`) e EAS Submit para as lojas; EAS Update para OTA |
| API | Qualquer runtime Node (Fly.io, Railway, Render) ou adaptar o Hono para Cloudflare Workers |

## Estado das integrações

| Serviço | Hoje | Para ser real |
| --- | --- | --- |
| TMDB / RAWG | Live com chave do utilizador | Mover chaves para a API (proxy) antes de produção |
| Letterboxd | Sync simulado + CSV import/export real | API oficial aprovada + OAuth na API |
| Serializd | Sync simulado + CSV genérico | Sem API pública |
| Logg | Sync simulado + CSV genérico | Sem API pública |
