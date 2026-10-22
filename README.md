# TRACKR

Hub universal para filmes, séries e videojogos, com motor social de match em grupo (TrackrMatch) e sync com Letterboxd, Serializd e Logg.

Corre em **iOS, Android e Web** a partir de uma única app Expo.

## Requisitos

- Node 22+
- npm 10+

## Começar

```bash
npm install
npm run web        # abre a versão web
npm run ios        # simulador iOS (macOS) ou Expo Go
npm run android    # emulador Android ou Expo Go
npm run api        # backend de sync em http://localhost:8787
```

## Qualidade

```bash
npm run typecheck  # todos os workspaces
npm test           # testes do core (sync, CSV) e da API
```

## Estrutura

| Pasta | Conteúdo |
| --- | --- |
| `apps/app` | App Expo + Expo Router (UI de todas as plataformas) |
| `apps/api` | Backend Hono: OAuth e sync no servidor |
| `packages/core` | Domínio, i18n PT/EN, adaptadores TMDB/RAWG, motor de sync, CSV |
| `packages/config` | Configuração TypeScript partilhada |
| `supabase/migrations` | Esquema Postgres com RLS: perfis, amizades, biblioteca, feed, reações, votos |

Regras: `apps/app` e `apps/api` dependem de `packages/core` e nunca um do outro. `packages/core` não importa React, Expo nem Node. Rotas em `apps/app/src/app` só montam um ecrã de `features/`.

## Backend (Supabase)

Sem configuração a app corre só no dispositivo. Para contas e biblioteca na cloud:

1. Criar um projeto em supabase.com.
2. Correr `supabase/migrations/*.sql` no SQL Editor (ou `supabase db push`).
3. Copiar `apps/app/.env.example` para `apps/app/.env` com o Project URL e a publishable key.

Ao entrar, a biblioteca do dispositivo junta-se à da cloud (ganha a versão mais recente de cada título) e cada alteração é enviada a seguir.

## Funcionalidades

- **Início** — biblioteca em filas (Continuar, Para começar, Completados) por tipo, e pesquisa (mock ou TMDB/RAWG live).
- **Página do título** — banner, sinopse, estado, nota, notas pessoais; temporadas com episódios e ratings nas séries, conquistas nos jogos; capa e banner personalizáveis.
- **Match** — deck com swipe; dá match quando a tribo presente já aprovou o título.
- **Social** — feed da Tribo e Global, com reações.
- **Perfil** — nome, bio e foto; conta TRACKR; sync com Letterboxd/Serializd/Logg e import/export CSV.
- **PT/EN** e **tema escuro/claro**, por defeito iguais aos do sistema.
