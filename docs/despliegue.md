# Despliegue a producción

Lista de pasos para poner TuGameMaster en `https://tugamemaster.com`, y las
comprobaciones para darlo por bueno. Está escrita para repetirse (otro
dominio, otra cuenta, un desastre) sin depender de nadie.

Las variables se describen en `docs/environment_setup.md`. Aquí solo se dice
**qué valor de producción lleva cada una y de dónde sale**. Ningún valor real
se escribe en este fichero ni en el repositorio.

## Cómo funciona el despliegue

- Vercel compila con `npm run vercel-build` (`scripts/vercel-build.mjs`).
- **Solo producción aplica las migraciones** (`prisma migrate deploy`), antes
  de compilar. Un despliegue de prueba (preview) no toca nunca la base de
  datos.
- Si la migración falla, el despliegue se para y sigue sirviendo la versión
  anterior. Si la migración sale bien y la compilación falla, la versión
  anterior queda corriendo sobre el esquema nuevo: por eso **las migraciones
  tienen que ser compatibles hacia atrás** (añadir columnas antes de usarlas;
  borrar o renombrar en un despliegue posterior).
- El despliegue de producción **se niega a compilar** si `src/lib/titular.ts`
  conserva algún `PENDIENTE`: el aviso legal es obligatorio.
- La región es `fra1` (Frankfurt, `vercel.json`), la misma que la base de
  datos. Sin eso, cada consulta cruzaría el Atlántico.
- La base de datos de producción **no se siembra nunca**. El seed crea usuarios
  con contraseñas conocidas.

## Orden de los pasos

Empezando por lo que más tarda, que es la verificación de Stripe.

### 1. Stripe en modo real

1. Dashboard de Stripe → _Activar pagos_. Pide los datos del titular, el NIF,
   la cuenta bancaria y una descripción del negocio. Como web pon
   `https://tugamemaster.com`; Stripe revisa que tenga condiciones, política de
   devoluciones, privacidad y contacto (`/condiciones`, `/privacidad`,
   `/contacto`).
2. _Connect_ → activar, tipo de cuenta **Express**, modelo _plataforma o
   marketplace_. Completa el **perfil de la plataforma** y la **marca** (nombre,
   icono, color `#c9973f`): es lo que ven los GMs en el alta.
3. Las claves `live` (`sk_live_…`, `pk_live_…`) solo se copian a Vercel.

Los webhooks se configuran en el paso 8, cuando la web ya responde.

### 2. Dominio y correo de contacto (Hostinger)

El dominio sigue en Hostinger y **los DNS también**: así todos los registros
(web, envío de correo y recepción) viven en un único panel.

- **Recibir en `hola@tugamemaster.com`**: o el correo de Hostinger si el plan
  lo incluye, o un reenvío gratuito como ImprovMX hacia tu buzón personal. El
  reenvío añade dos registros `MX` y un `TXT` de SPF en la raíz del dominio.
- Resend firma desde el subdominio `send.`, así que su SPF no choca con el de
  la raíz.

### 3. Vercel

1. Plan **Pro** (el gratuito no admite uso comercial).
2. _Add New Project_ → importar el repositorio de GitHub. Framework Next.js,
   comandos por defecto (Vercel detecta `vercel-build`). Node **22.x** en
   _Settings_ → _General_.
3. _Settings_ → _Domains_ → añadir `tugamemaster.com` y `www.tugamemaster.com`
   (que redirija al primero). Vercel muestra los registros que hay que crear en
   Hostinger: un `A` para la raíz y un `CNAME` para `www`. Hay que **borrar** el
   `A` y el `CNAME` que Hostinger trae por defecto, o seguirá saliendo su página
   de aparcamiento.
4. _Storage_ → crear un **Blob store** de producción y conectarlo al proyecto
   (rellena `BLOB_READ_WRITE_TOKEN`).
5. _Settings_ → _Deployment Protection_: los despliegues de prueba con
   protección de Vercel, para que no sean públicos.

### 4. Neon

1. **Proyecto nuevo** solo para producción, región **AWS Europe Central 1
   (Frankfurt)**, Postgres de la misma versión que desarrollo.
2. Copiar las dos cadenas: la _pooled_ (`DATABASE_URL`) y la directa
   (`DIRECT_URL`), las dos acabadas en `?sslmode=verify-full`.
3. Plan de pago: da historial para restaurar la base a un instante anterior.
   Con dinero de por medio no es opcional.

### 5. Resend

1. _Domains_ → añadir `tugamemaster.com`, región UE.
2. Crear en Hostinger los registros que indique (`MX` y `TXT` en `send.`, el
   DKIM en `resend._domainkey`) y añadir un DMARC:
   `_dmarc` → `v=DMARC1; p=none; rua=mailto:hola@tugamemaster.com`.
3. Esperar a que salga _Verified_ y crear una API key **solo de envío** para
   producción.

### 6. Discord y Sentry

- **Discord**: en la aplicación, _OAuth2_ → _Redirects_ → añadir
  `https://tugamemaster.com/api/auth/callback/discord`. Se puede usar la misma
  aplicación que en desarrollo.
- **Sentry** (opcional, gratuito): proyecto Next.js, copiar el DSN y crear un
  token de subida para los mapas de fuentes.

### 7. Variables de entorno en Vercel

_Settings_ → _Environment Variables_, marcadas **solo para Production**:

| Variable                             | Valor de producción                                      |
| ------------------------------------ | -------------------------------------------------------- |
| `DATABASE_URL`                       | Neon de producción, _pooled_                             |
| `DIRECT_URL`                         | Neon de producción, directa                              |
| `AUTH_SECRET`                        | **Nuevo**: `npx auth secret`. Nunca el de desarrollo.    |
| `AUTH_URL`                           | `https://tugamemaster.com`                               |
| `AUTH_DISCORD_ID`                    | Aplicación de Discord                                    |
| `AUTH_DISCORD_SECRET`                | Aplicación de Discord                                    |
| `STRIPE_SECRET_KEY`                  | `sk_live_…`                                              |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_live_…`                                              |
| `STRIPE_WEBHOOK_SECRET`              | Paso 8, destino _Your account_                           |
| `STRIPE_WEBHOOK_SECRET_CONNECT`      | Paso 8, destino _Connected accounts_                     |
| `CRON_SECRET`                        | **Nuevo**: `openssl rand -hex 32`                        |
| `RESEND_API_KEY`                     | Clave de producción de Resend                            |
| `EMAIL_FROM`                         | `TuGameMaster <no-reply@tugamemaster.com>`               |
| `EMAIL_REDIRECT_TO`                  | **Vacía**. Con valor, ningún usuario recibe sus correos. |
| `BLOB_READ_WRITE_TOKEN`              | Lo rellena el Blob store                                 |
| `SITIO_INDEXABLE`                    | Vacía durante el lanzamiento discreto; `true` al abrir   |
| `SENTRY_*`                           | Opcionales                                               |

Comprobar cada una **por su valor**, no por su presencia: que las de Stripe
empiecen por `live`, que `AUTH_URL` sea el dominio y no `localhost`, que
`EMAIL_REDIRECT_TO` esté vacía.

Para los despliegues de prueba (_Preview_) van las de desarrollo: Neon de
desarrollo y Stripe en test.

### 8. Primer despliegue y webhooks

1. Desplegar `main`. En el registro tiene que salir `prisma migrate deploy`
   aplicando todas las migraciones.
2. Stripe → _Developers_ → _Webhooks_ → dos destinos con la URL
   `https://tugamemaster.com/api/webhooks/stripe` (eventos en
   `docs/environment_setup.md`). Copiar los dos secretos a Vercel y **volver a
   desplegar**: las variables nuevas solo se leen en un despliegue nuevo.

### 9. Primer administrador

Registrarse en la web con la cuenta propia y, en el _SQL Editor_ de Neon:

```sql
UPDATE "User" SET "isAdmin" = true WHERE "email" = '<tu correo>';
```

Cerrar sesión y volver a entrar para que la sesión lo recoja.

## Comprobaciones

Antes de anunciar nada:

- [ ] `https://tugamemaster.com` carga con candado, y `www` redirige a la raíz.
- [ ] `/estilo` da 404.
- [ ] El código fuente de la portada lleva `noindex` (lanzamiento discreto).
- [ ] Registro con correo: llega el correo, enviado desde `no-reply@`.
- [ ] Entrar con Discord funciona.
- [ ] `/r/<código>` de un fundador lleva al registro con el código puesto.
- [ ] Alta de GM en Stripe Connect con datos reales; al volver, la cuenta sale
      verificada **sin recargar a mano** (prueba que llega `account.updated` por
      el segundo destino).
- [ ] Partida de 1 € pagada con tarjeta propia: la reserva pasa a pagada y en
      Stripe el webhook figura con respuesta 200.
- [ ] El cron responde 401 sin el secreto y 200 con él:

      curl -i -H "Authorization: Bearer $CRON_SECRET" https://tugamemaster.com/api/cron/daily

- [ ] 48 horas después del final de esa partida, la transferencia al GM aparece
      en Stripe y en `/cuenta/cobros`.
- [ ] Una petición a `/api/webhooks/stripe` sin firma devuelve 400.

## Abrir la web a los buscadores

`SITIO_INDEXABLE=true` en producción y volver a desplegar. Después, dar de
alta el dominio en Google Search Console.
