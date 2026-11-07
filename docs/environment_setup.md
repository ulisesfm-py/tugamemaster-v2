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

| Variable                             | Descripción                                 |
| ------------------------------------ | ------------------------------------------- |
| `STRIPE_SECRET_KEY`                  | Clave secreta de la plataforma.             |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Clave pública, se envía al navegador.       |
| `STRIPE_WEBHOOK_SECRET`              | Secreto de firma del endpoint de webhooks.  |
| `STRIPE_WEBHOOK_SECRET_CONNECT`      | Solo producción: el del destino de Connect. |

**Dónde se obtiene**: [Dashboard de Stripe](https://dashboard.stripe.com) →
_Developers_ → _API keys_. Usa siempre las claves de **test** (`sk_test_…`,
`pk_test_…`) en desarrollo.

**Webhook en local**: el secreto lo imprime la CLI de Stripe al arrancar el
reenvío, y es distinto del de producción:

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

**Webhooks en producción: dos destinos.** En _Developers_ → _Webhooks_ se
crean dos destinos con la misma URL, `https://tugamemaster.com/api/webhooks/stripe`:

| Destino              | Eventos                                                                                 | Secreto                         |
| -------------------- | --------------------------------------------------------------------------------------- | ------------------------------- |
| _Your account_       | `payment_intent.succeeded`, `payment_intent.payment_failed`, `checkout.session.expired` | `STRIPE_WEBHOOK_SECRET`         |
| _Connected accounts_ | `account.updated`                                                                       | `STRIPE_WEBHOOK_SECRET_CONNECT` |

Cada destino tiene su propio _Signing secret_. Si falta el segundo, los cobros
funcionan pero el estado de verificación de los GMs no se actualiza solo.

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

### Email (Resend, opcional en desarrollo)

| Variable            | Descripción                                                   |
| ------------------- | ------------------------------------------------------------- |
| `RESEND_API_KEY`    | Clave de API para email transaccional.                        |
| `EMAIL_FROM`        | Remitente de los correos, p. ej. `TuGameMaster <no-reply@…>`. |
| `EMAIL_REDIRECT_TO` | Solo desarrollo: desvía **todo** el correo a esta dirección.  |

**Si se dejan vacías, la aplicación funciona igual**: cada correo se compone
entero y se vuelca al registro de la consola en vez de enviarse. Se puede
desarrollar y comprobar qué dice cada aviso, a quién va y cuándo sale sin tener
cuenta de Resend.

Hay tres etapas, y solo la última toca DNS:

1. **Sin cuenta.** Variables vacías, correos al registro. Es el modo por
   defecto en local.
2. **Con cuenta, sin dominio.** [Resend](https://resend.com) → _API Keys_.
   Poniendo `EMAIL_FROM=onboarding@resend.dev` se envía de verdad, pero **solo
   a la dirección con la que se creó la cuenta**. Sirve para ver los correos en
   un buzón real.
3. **Con dominio propio.** Resend → _Domains_ → añadir `tugamemaster.com`, y
   copiar en el proveedor de DNS los registros TXT que indique (SPF y DKIM;
   conviene añadir DMARC). Ya se puede enviar a cualquiera desde
   `no-reply@tugamemaster.com`.

Enviar **no requiere buzón de correo**: un remitente `no-reply@` solo necesita
esos registros DNS. El buzón hace falta para recibir respuestas, que es otra
decisión.

#### El desvío de desarrollo

Los usuarios del seed tienen direcciones inventadas (`ana@tugamemaster.test`) y
`.test` es un TLD reservado que no resuelve en ningún sitio. Enviarles de verdad
genera **rebotes duros**, que es lo que más castiga la reputación de un
remitente — y un dominio recién verificado no tiene ningún colchón.

Por eso, en cuanto haya clave de API conviene poner también:

```
EMAIL_REDIRECT_TO=tu-correo@ejemplo.com
```

Con eso, todos los correos llegan a ese buzón sea quien sea el destinatario, y
el asunto dice a quién iban de verdad: `[para: ana@tugamemaster.test] Tu plaza
está confirmada`. En producción se deja **vacía**; si se configura por error,
queda un aviso en el registro porque significa que ningún usuario recibe lo suyo.

Recuerda que los enlaces de los correos salen de `AUTH_URL`: en local apuntan a
`localhost`, así que sirven para leer el correo, no para pulsarlos desde el móvil.

### Buscadores

| Variable          | Descripción                                               |
| ----------------- | --------------------------------------------------------- |
| `SITIO_INDEXABLE` | `true` para que Google indexe la web. Solo en producción. |

Vacía, todas las páginas llevan `noindex`: es el **lanzamiento discreto**. Se
lee al compilar, así que tras cambiarla hay que volver a desplegar. Un
despliegue de prueba no se indexa nunca. Ver `src/lib/indexacion.ts`.

### Almacenamiento de imágenes

| Variable                | Descripción                                             |
| ----------------------- | ------------------------------------------------------- |
| `BLOB_READ_WRITE_TOKEN` | Token de escritura para avatares e imágenes de partida. |

**Dónde se obtiene**: panel de Vercel → _Storage_ → _Blob_ → _Connect_.

### Observabilidad (Sentry, opcional)

| Variable                 | Descripción                                         |
| ------------------------ | --------------------------------------------------- |
| `SENTRY_DSN`             | DSN del proyecto. Errores del servidor.             |
| `NEXT_PUBLIC_SENTRY_DSN` | DSN para el navegador. Errores del cliente.         |
| `SENTRY_ORG`             | Organización, solo para subir los mapas de fuentes. |
| `SENTRY_PROJECT`         | Proyecto, ídem.                                     |
| `SENTRY_AUTH_TOKEN`      | Token de subida, ídem. **Este sí es un secreto.**   |

**Si se dejan vacías, la aplicación funciona con normalidad** y no se
inicializa nada. Es el mismo criterio que con Resend.

**Dónde se obtiene**: [Sentry](https://sentry.io) → crear proyecto de tipo
_Next.js_ → _Settings_ → _Client Keys (DSN)_. El mismo valor sirve para las dos
primeras variables.

Un DSN **no es un secreto**: está pensado para viajar en el código que se
descarga el navegador y solo permite enviar eventos al proyecto, no leer nada.
El que sí hay que proteger es `SENTRY_AUTH_TOKEN`.

#### Qué se envía y qué no

- **No se envían datos personales.** `sendDefaultPii` está en `false` a
  propósito: el asistente de Sentry lo deja en `true`, y con eso se adjuntan la
  IP, las cabeceras y los datos del usuario a cada error. Aquí se manejan
  correos, reservas y pagos.
- **No se graba la sesión.** Session Replay queda desactivado: registra lo que
  el usuario ve y escribe, y hay formularios de pago de por medio.
- **No se muestrea el rendimiento** (`tracesSampleRate: 0`). Lo que se quiere
  son los errores; las trazas son las que consumen la cuota y activarlas es una
  decisión aparte.

Los ajustes viven en `src/lib/observabilidad.ts` y hay pruebas que fallan si
alguien los cambia sin querer.

## Entornos

| Entorno    | Base de datos                           | Stripe          | Notas                                                        |
| ---------- | --------------------------------------- | --------------- | ------------------------------------------------------------ |
| Desarrollo | Proyecto de Neon de desarrollo          | Claves de test  | Webhooks vía `stripe listen`.                                |
| Preview    | Proyecto de Neon de desarrollo          | Claves de test  | No aplica migraciones. Nunca la base de datos de producción. |
| Producción | **Proyecto de Neon propio** (Frankfurt) | Claves **live** | Migra al desplegar. `AUTH_SECRET` y `CRON_SECRET` distintos. |

Producción va en un **proyecto de Neon aparte**, no en una rama del de
desarrollo: las pruebas E2E borran filas con SQL directo, y una cadena de
conexión mal copiada no debe poder vaciar la base real. Los pasos del
despliegue están en `docs/despliegue.md`.

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

## `sslmode` en las cadenas de conexión

Ambas cadenas deben terminar en **`?sslmode=verify-full`**, no en
`sslmode=require`.

El driver de PostgreSQL que usamos ya trata `require` como `verify-full` (es
decir, verifica el certificado del servidor), pero avisa en cada arranque de
que ese comportamiento difiere de libpq. Escribirlo de forma explícita deja la
intención clara y silencia el aviso. Neon lo admite sin configuración
adicional.
