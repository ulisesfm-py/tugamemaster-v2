# TuGameMaster

Marketplace donde los Game Masters publican partidas de rol y los jugadores
reservan y pagan su asiento.

La especificación funcional, las decisiones de arquitectura y las reglas del
flujo de dinero están en [`CLAUDE.md`](./CLAUDE.md). Es el documento de
referencia del proyecto: si algo de aquí lo contradice, manda `CLAUDE.md`.

## Stack

Next.js (App Router) · TypeScript · Tailwind CSS · PostgreSQL (Neon) · Prisma ·
Auth.js · Stripe Connect · Vercel

## Requisitos

- **Node 22** (el repo incluye `.nvmrc`; con nvm basta `nvm use`)
- npm

## Puesta en marcha

```bash
cp .env.example .env.local   # y rellena los valores
npm install
npm run dev
```

Qué significa cada variable y dónde se obtiene:
[`docs/environment_setup.md`](./docs/environment_setup.md).

## Comandos

| Comando                | Qué hace                                        |
| ---------------------- | ----------------------------------------------- |
| `npm run dev`          | Servidor de desarrollo en http://localhost:3000 |
| `npm run build`        | Build de producción                             |
| `npm run lint`         | ESLint                                          |
| `npm run typecheck`    | Comprobación de tipos sin emitir                |
| `npm run format`       | Formatea con Prettier                           |
| `npm run format:check` | Verifica el formato (lo que corre en CI)        |

## Secretos

Ninguna clave, token o credencial se commitea. Los valores reales van en
`.env.local` (ignorado por git) y en el panel del proveedor de hosting.
`.env.example` contiene solo los nombres de las variables, siempre vacías.
