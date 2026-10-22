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
| `docs/` | Arquitetura e protótipo original |

Detalhes em [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Funcionalidades

- **O Meu Trackr** — biblioteca com filtros, pesquisa (mock ou TMDB/RAWG live), notas, progresso e classificação.
- **TrackrMatch** — deck com swipe; dá match quando a tribo presente já aprovou o título.
- **Feed da Tribo** — atividade dos amigos com reações.
- **Perfil & Sync** — ligação a Letterboxd/Serializd/Logg com sync bidirecional, política de conflitos, sync automático e import/export CSV.
- **PT/EN** e **tema escuro/claro**, por defeito iguais aos do sistema.
