# CLAUDE.md

## Contexto del proyecto

TuGameMaster.com es un marketplace donde Game Masters (GMs) publican partidas
de rol con un número limitado de plazas, un precio por jugador y una fecha, y
los jugadores reservan y pagan su sitio.

Este es un **replanteamiento completo desde cero**. Existió una v1 (hace 2
años, hecha con un freelancer) que nunca llegó a funcionar de forma estable:
las claves/secretos y la base de datos estaban mal configurados, y el diseño
visual era pobre. El código de la v1 está disponible como referencia en
`../tu_game_master`, pero **no debe copiarse ni usarse como base**. Úsala
solo para entender la intención funcional original y para no repetir los
mismos errores de arquitectura (especialmente en el manejo de secretos y en
el modelo de datos). Cuando algo de la v1 no tenga sentido o exista una forma
más simple/moderna de resolverlo, prioriza siempre la solución mejor, no la
fidelidad a lo anterior.

## Funcionalidades clave (resumen)

- **Dos tipos de usuario**: jugador y game master (un mismo usuario puede ser
  ambos).
- **Partidas**: el GM crea una partida con N asientos, precio por asiento y
  fecha/hora. Aparece listada en el portal público. Para poder crear partidas
  el GM debe configurar primero su cuenta en la que recibir el pago.
- **Reservas y pagos**: el jugador paga en el momento de reservar el asiento
  (cobro inmediato con tarjeta, 3DS resuelto en pantalla). El dinero queda
  retenido en el balance de la plataforma. El GM cobra su parte **48 horas
  después de finalizada la partida**, si no hay incidencias reportadas.
  TuGameMaster retiene un **5%** del total cobrado en esa partida.
- **Cancelaciones y reembolsos**:
  - El jugador puede cancelar **sin coste hasta 48h antes** del inicio:
    reembolso íntegro y liberación inmediata del asiento.
  - Dentro de las últimas 48h, la cancelación por parte del jugador no da
    derecho a reembolso.
  - Si el GM no se presenta o hay una incidencia, el jugador puede
    **solicitar** un reembolso. Un admin lo revisa y lo aprueba manualmente
    tras comprobar la incidencia; no hay automatismo en la v1.
  - La solicitud debe presentarse **antes de que se ejecute el pago al GM**
    (la ventana de 48h posterior al final de la partida). Una incidencia
    abierta bloquea el pago al GM hasta que el admin la resuelva.
- **Perfiles de usuario**: personalizables, con gustos y preferencias de rol.
- **Blog**: los admins publican artículos; los usuarios comentan y dan like.
  El cuerpo es **texto plano**: se respetan los saltos de línea y no se
  interpreta ni HTML ni Markdown, para no tener que sanear la salida. Un
  comentario lo puede retirar su autor o un admin, y nadie más. Un artículo
  publicado se retira, no se borra: borrar solo se ofrece sobre borradores,
  porque se lleva por delante los comentarios de otra gente. El `slug` se
  genera del título la primera vez y ya no cambia, para no romper enlaces.
  Reglas en `src/modules/blog/politica.ts`.
- **Reviews**: los jugadores valoran a los GMs con estrellas + comentario opcional,
  visible en la página pública del GM. Solo valora quien reservó, pagó y jugó
  aquí, dentro de los 60 días siguientes al final de la partida, y con 14 días
  para corregir la reseña antes de que se congele. Una reserva reembolsada por
  incidencia **no** valora: esa vía ya tiene su cauce. Una valoración baja no
  retiene el pago al GM; para eso están las incidencias. Reglas en
  `src/modules/reviews/politica.ts`.
- **Historial de partidas**: se guarda un registro de las partidas creadas por GM y
  se permite la opción de crear una continuación a dicha partida otro día. En modo
  campaña, al terminar la partida el GM puede escribir información sobre dónde terminó
  la sesión (jugadores, niveles, vida, acontecimientos, localización, etc) y se guarda
  una plantilla para crear la siguiente sesión. Solamente los usuarios que participaron
  en la primera sesión pueden inscribirse en la 2nda. Al hacer click en la campaña se
  muestra una breve descripción. Cada GM y cada jugador tienen en su perfil un historial
  las partidas en las que han participado.
  Una campaña no se declara de antemano: **nace cuando el GM continúa una partida
  ya jugada**, y la continuada pasa a ser su sesión 1. La nota de sesión la ven
  solo el GM y quienes jugaron esa sesión — cuenta lo que hicieron sus personajes,
  así que publicarla reventaría la campaña. Reglas en
  `src/modules/campaigns/politica.ts`.
- **Login con Discord**: además de email/contraseña, los usuarios pueden
  registrarse e iniciar sesión con su cuenta de Discord (OAuth2). Guardamos su
  ID de Discord para uso futuro (salas de partida). No pedir permisos de
  Discord más allá de identidad básica (username, avatar, email).
- **Reputación y garantía exclusivas de la plataforma**: las estrellas,
  reseñas y el contador de partidas jugadas de un GM solo se generan a partir
  de partidas reservadas y pagadas a través de la web. La web debe dejar claro
  en el perfil del GM que esa reputación certifica partidas gestionadas por la
  plataforma. De cara a futuro, las reservas pagadas por la web tendrán
  derecho a reembolso automático ante cancelación o incidencia — dejar el
  modelo de datos preparado para poder marcar una reserva como
  "protegida"/"reembolsada", aunque el proceso de disputa en v1 sea manual
  (revisión por un admin, sin automatizar todavía).

## Fuera de alcance para la v1 (backlog, no implementar todavía)

- **Salas de Discord automatizadas por partida**: crear/gestionar un bot
  propio de Discord que genere canales de voz temporales por partida
  (desbloqueo antes de empezar, borrado horas después). Requiere un servidor
  de Discord propio, un bot con permisos de administración de canales, y un
  proceso programado (cron/worker) para crear y destruir canales. No
  implementar hasta tener la v1 base funcionando; cuando llegue el momento,
  debe diseñarse como un servicio aparte y desacoplado del resto del backend,
  no integrado directamente en el flujo de reservas.

## Tech stack

Decidido en la fase de planificación. No cambiar sin discutirlo.

- **Frontend**: Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS 4
  - shadcn/ui
- **Backend**: el mismo Next.js (route handlers + server actions). Monolito
  modular, no hay servicio de API separado.
- **Base de datos**: PostgreSQL en Neon + Prisma como ORM y sistema de
  migraciones.
- **Pagos**: Stripe Connect (cuentas Express) con _separate charges and
  transfers_. Ver `docs/payments.md`.
- **Auth**: Auth.js v5 — Credentials (email + contraseña, hash argon2) y
  Discord OAuth2 (scopes `identify email` únicamente).
- **Hosting/despliegue**: Vercel + Neon. Cron de Vercel para los jobs.
- **Complementos**: Zod (validación), Resend (email transaccional), Vercel
  Blob (imágenes), Sentry (errores), Vitest + Playwright (tests).
- **Runtime**: Node 22 LTS (fijado en `.nvmrc`; `engines` lo exige en
  `package.json`).

## Reglas del flujo de dinero (no negociables)

**Secuencia canónica**: el jugador paga al reservar (cobro inmediato,
on-session) -> el dinero se retiene en el balance de la plataforma -> un job
diario transfiere al GM el 95% de las reservas cuyas partidas terminaron hace
más de 48h y no tienen incidencia abierta. La plataforma es merchant of
record; se usan _separate charges and transfers_, nunca destination charges.

- Importes siempre como **enteros en céntimos** + código de moneda. Nunca
  usar float ni decimales en coma flotante para dinero.
- La **comisión del 5%** se calcula sobre el total cobrado de la partida y se
  persiste en la reserva en el momento del cobro. Nunca se recalcula después
  a partir de porcentajes: si la política cambia, las reservas antiguas
  conservan la comisión con la que se vendieron.
- **Los costes de Stripe nunca los asume TuGameMaster.** Se descuentan del
  pago al GM, usando el coste **real** que Stripe reporta en la
  `balance_transaction` del cobro, nunca una estimación. La fórmula del
  pago al GM es:

      transferencia_al_gm = importe_cobrado - comision_5% - coste_real_stripe

  Los tres valores se persisten en la reserva. El 5% es el margen bruto de la
  plataforma y el coste de Stripe es un pass-through al GM.

- **Si el game master cancela una partida, quien pagó recupera el 100% en
  saldo**, sin que importe cuánto falte para jugarla. El plazo de 48 horas
  protege al GM de quien se descuelga tarde; cuando el que se descuelga es él,
  aplicarlo sería cobrarle al jugador un plantón ajeno.
- **Las devoluciones se abonan como saldo, no vuelven a la tarjeta** (decidido
  en la fase 7). En un reembolso Stripe no devuelve la comisión del cobro
  original, así que devolver el dinero de verdad dejaría un coste que alguien
  tendría que asumir. Si el dinero no sale de la plataforma, ese problema no
  existe: se abona en el monedero del jugador. Cancelación dentro de plazo,
  90%; incidencia aprobada por un admin, 100%. Solo un administrador puede
  convertir saldo en dinero real, y solo la parte que entró por tarjeta.
- Cada transición de dinero es una **fila con estado explícito** en
  `PaymentEvent`, con `stripeId` e `idempotencyKey` únicos. Prohibido guardar
  el objeto de Stripe como JSON opaco y derivar el estado de él (error de la
  v1).
- Los **webhooks de Stripe son la fuente de verdad** del estado de un pago,
  no la respuesta inmediata de la llamada a la API.
- El job de pago a GMs debe ser **idempotente y reintentable**: ejecutarlo dos
  veces no puede transferir dos veces. Se apoya en `idempotencyKey` y en el
  estado de la reserva, no en que el cron se ejecute una sola vez.
- **Ninguna transferencia a un GM sale sin comprobar** que la partida terminó
  hace más de 48h y que no existe ninguna incidencia abierta ni solicitud de
  reembolso pendiente sobre esa reserva.
- Stripe solo se invoca desde `src/modules/payments`. Ningún otro módulo
  importa el SDK de Stripe.
- La reputación de un GM (estrellas, número de partidas) se deriva
  exclusivamente de reservas pagadas y completadas en la plataforma.

## Avisos por correo

- **Un aviso que falla no rompe lo que lo provoca.** Si Resend está caído, el
  jugador ha pagado igual y su plaza sigue siendo suya. Los envíos van siempre
  **fuera** de la transacción y envueltos de forma que registren el fallo y
  sigan; nunca deben tumbar un cobro ni dejar un webhook devolviendo 500.
- El correo es **opcional**: sin `RESEND_API_KEY` la aplicación funciona y cada
  aviso se vuelca al registro. Mismo criterio que Discord y Vercel Blob.
- Las plantillas son **lógica pura** en `src/modules/notifications/plantillas.ts`:
  reciben datos sueltos, no filas de Prisma, y se comprueban sin enviar nada.
  Todo correo lleva versión en texto plano además de HTML.
- Lo que se mete en el HTML va **escapado**: los títulos y las notas los
  escriben personas.

## Jobs programados

- Un único endpoint `/api/cron/daily` ejecuta todas las tareas diarias en
  secuencia. Cada tarea es idempotente y deja traza en `ScheduledJob`.
- El cron se ejecuta a las **04:00 Europe/Madrid**. Ninguna lógica de negocio
  puede depender del minuto exacto de ejecución: el pago al GM se define como
  "48h o más después del final", no como "exactamente a las 48h".
- Los jobs se invocan por HTTP con un secreto compartido, sin usar APIs
  propietarias del proveedor de hosting. Cambiar de disparador (Vercel Cron,
  GitHub Actions, QStash) no debe requerir tocar la lógica.

## Convenciones de código

- **Estructura**: `src/app` solo enruta y renderiza; la lógica de negocio vive
  en `src/modules/<contexto>` (`schema.ts`, `service.ts`, `queries.ts`,
  `actions.ts`); la infraestructura compartida en `src/lib`.
- **Nombres**: carpetas y ficheros en `kebab-case`; componentes React en
  `PascalCase`; variables y funciones en `camelCase`; tablas y modelos de
  Prisma en `PascalCase` singular (`Booking`, no `bookings`).
- **Tipos**: TypeScript en modo estricto. Prohibido `any`. Los tipos de datos
  se derivan de Prisma y de los esquemas de Zod, no se escriben a mano por
  duplicado.
- **Validación**: todo input externo (formulario, API, webhook) se valida con
  Zod en el servidor, aunque ya se haya validado en el cliente.
- **Concurrencia**: la reserva de asientos se resuelve dentro de una
  transacción con bloqueo de la fila de la partida, más un constraint único
  `(gameId, userId)`.
- **Testing**: Vitest para la lógica de dominio (obligatorio en pagos,
  reservas y reputación); Playwright para el camino crítico reservar -> cobrar
  -> jugar -> pagar al GM. Las pruebas de pagos usan Stripe Test Clocks.
- **Linting**: ESLint + Prettier, ejecutados en CI. No se commitea código que
  no pase lint ni tests.

## Manejo de secretos (importante — esto falló en la v1)

- Ninguna clave, token o credencial va en el código ni se sube al repo.
- Usar variables de entorno (`.env`) y añadir `.env` al `.gitignore` desde el
  primer commit.
- Documentar en `docs/environment_setup.md` qué variables se necesitan y
  cómo obtenerlas, sin poner valores reales.

## Flujo de trabajo esperado

1. Antes de implementar una funcionalidad nueva, proponer un plan breve y
   esperar aprobación.
2. Avanzar por fases pequeñas y verificables (no todo de una vez).
3. Hacer commit al finalizar cada fase funcional, con mensajes descriptivos.
4. Señalar explícitamente cualquier decisión de arquitectura importante antes
   de implementarla, no después.

## Qué NO hacer

- No copiar código, estructura de carpetas ni decisiones de arquitectura de
  `../tu-game-master`.
- No implementar el flujo de pagos sin antes explicar el enfoque y confirmar.
- No añadir dependencias o servicios externos nuevos sin mencionarlo primero.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
