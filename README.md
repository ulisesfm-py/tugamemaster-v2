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
| `npm test`             | Pruebas de dominio (Vitest)                     |
| `npm run e2e`          | Pruebas de extremo a extremo (Playwright)       |
| `npm run e2e:ui`       | Las mismas, con el visor interactivo            |

## Pruebas

`npm test` no necesita nada: es lógica pura.

`npm run e2e` levanta la aplicación y la conduce con un navegador de verdad
contra la base de datos de desarrollo, así que necesita `.env.local` y el seed
puesto (`npm run db:seed`). Cada prueba se fabrica sus propios datos y los
borra al terminar; el envío de correo queda apagado mientras corren.

No están en CI todavía: harían falta una base de datos y unos secretos en el
runner, y esa es una decisión de infraestructura aparte.

## Secretos

Ninguna clave, token o credencial se commitea. Los valores reales van en
`.env.local` (ignorado por git) y en el panel del proveedor de hosting.
`.env.example` contiene solo los nombres de las variables, siempre vacías.
