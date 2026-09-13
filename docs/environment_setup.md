# Configuración del entorno

Este documento describe **qué variables de entorno necesita el proyecto y
dónde se obtienen**. Nunca debe contener valores reales.

## Reglas

1. Los valores reales viven solo en `.env.local` (desarrollo) y en el panel
   del proveedor de hosting (producción). `.env*` está en `.gitignore`.
2. Si añades una variable nueva al código, añádela también a `.env.example`
   (con el valor vacío) y documéntala aquí en el mismo commit.
3. Si una clave se expone por accidente, **rótala primero** y limpia después.
   Un secreto que ha llegado a un repositorio se considera comprometido para
   siempre, aunque borres el commit.
4. Solo las variables con prefijo `NEXT_PUBLIC_` llegan al navegador. Nunca
   pongas ese prefijo en un secreto.

## Puesta en marcha

```bash
cp .env.example .env.local
# rellena los valores siguiendo las secciones de abajo
npm install
npx prisma migrate dev
npm run dev
```

## Variables

### Base de datos

| Variable       | Descripción                                                   |
| -------------- | ------------------------------------------------------------- |
| `DATABASE_URL` | Cadena de conexión a PostgreSQL (pooled).                     |
| `DIRECT_URL`   | Conexión directa, sin pooler. La usa Prisma para migraciones. |

**Dónde se obtiene**: panel de [Neon](https://neon.tech) → proyecto →
_Connection string_. Neon ofrece las dos cadenas; la _pooled_ va en
`DATABASE_URL` y la directa en `DIRECT_URL`.

En local puedes usar también un PostgreSQL propio; en ese caso ambas
variables apuntan a la misma cadena.

### Autenticación (Auth.js)

| Variable              | Descripción                                            |
| --------------------- | ------------------------------------------------------ |
| `AUTH_SECRET`         | Clave para firmar y cifrar las sesiones.               |
| `AUTH_URL`            | URL base de la app. En local, `http://localhost:3000`. |
| `AUTH_DISCORD_ID`     | Client ID de la aplicación de Discord.                 |
| `AUTH_DISCORD_SECRET` | Client secret de la aplicación de Discord.             |

**`AUTH_SECRET`**: genera uno nuevo con `npx auth secret`. Debe ser distinto
en desarrollo y en producción.

**Discord**: [Discord Developer Portal](https://discord.com/developers/applications)
→ _New Application_ → pestaña _OAuth2_. Copia el _Client ID_ y genera un
_Client Secret_. En _Redirects_ añade:

- Desarrollo: `http://localhost:3000/api/auth/callback/discord`
- Producción: `https://<dominio>/api/auth/callback/discord`

Scopes: **solo `identify` y `email`**. No solicitar permisos adicionales
(ver CLAUDE.md).

### Pagos (Stripe)

| Variable                             | Descripción                                |
| ------------------------------------ | ------------------------------------------ |
| `STRIPE_SECRET_KEY`                  | Clave secreta de la plataforma.            |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Clave pública, se envía al navegador.      |
| `STRIPE_WEBHOOK_SECRET`              | Secreto de firma del endpoint de webhooks. |

**Dónde se obtiene**: [Dashboard de Stripe](https://dashboard.stripe.com) →
_Developers_ → _API keys_. Usa siempre las claves de **test** (`sk_test_…`,
`pk_test_…`) en desarrollo.

**Webhook en local**: el secreto lo imprime la CLI de Stripe al arrancar el
reenvío, y es distinto del de producción:

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

En producción, el secreto está en _Developers_ → _Webhooks_ → tu endpoint →
_Signing secret_.

**Connect**: hay que activar Connect en el dashboard y configurar la marca de
la plataforma antes de que los GMs puedan darse de alta. La verificación
fiscal de la cuenta puede tardar días: conviene iniciarla pronto.

### Jobs programados

| Variable      | Descripción                                           |
| ------------- | ----------------------------------------------------- |
| `CRON_SECRET` | Token que autentica las llamadas a `/api/cron/daily`. |

Genera una cadena aleatoria larga (`openssl rand -hex 32`). El endpoint debe
rechazar cualquier petición que no lo presente: sin él, un tercero podría
disparar las transferencias a los GMs.

### Email (Resend)

| Variable         | Descripción                                                   |
| ---------------- | ------------------------------------------------------------- |
| `RESEND_API_KEY` | Clave de API para email transaccional.                        |
| `EMAIL_FROM`     | Remitente de los correos, p. ej. `TuGameMaster <no-reply@…>`. |

**Dónde se obtiene**: [Resend](https://resend.com) → _API Keys_. El dominio
del remitente debe estar verificado (registros DNS) antes de poder enviar a
direcciones reales.

### Almacenamiento de imágenes

| Variable                | Descripción                                             |
| ----------------------- | ------------------------------------------------------- |
| `BLOB_READ_WRITE_TOKEN` | Token de escritura para avatares e imágenes de partida. |

**Dónde se obtiene**: panel de Vercel → _Storage_ → _Blob_ → _Connect_.

### Observabilidad (opcional en desarrollo)

| Variable     | Descripción                 |
| ------------ | --------------------------- |
| `SENTRY_DSN` | DSN del proyecto en Sentry. |

Si se deja vacío, el registro de errores queda desactivado y la aplicación
funciona con normalidad.

## Entornos

| Entorno    | Base de datos                 | Stripe          | Notas                                              |
| ---------- | ----------------------------- | --------------- | -------------------------------------------------- |
| Desarrollo | Rama de Neon o Postgres local | Claves de test  | Webhooks vía `stripe listen`.                      |
| Preview    | Rama de Neon por PR           | Claves de test  | Nunca apuntar a la base de datos de producción.    |
| Producción | Neon (rama principal)         | Claves **live** | `AUTH_SECRET` y `CRON_SECRET` propios y distintos. |

## Nota sobre `npm audit` y `mysql2`

`package.json` incluye un `overrides` que fuerza `mysql2` a una version
parcheada. El CLI de Prisma lo fija a una version con vulnerabilidades
conocidas, pero:

- `prisma` es una `devDependency`: `mysql2` no llega al despliegue.
- Usamos PostgreSQL, asi que ese driver no se carga nunca.
- Las vulnerabilidades solo se explotan conectandose a un servidor MySQL
  malicioso.

El `overrides` no esta ahi por riesgo real, sino para que `npm audit` quede
limpio y una vulnerabilidad futura de verdad no se pierda entre el ruido. Si
algun dia Prisma actualiza su pin, se puede quitar.
