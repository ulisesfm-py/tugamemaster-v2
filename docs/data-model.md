# Modelo de datos

Fuente de verdad: [`prisma/schema.prisma`](../prisma/schema.prisma). Este
documento explica **por qué** el modelo es así; el esquema dice **cómo** es.

El modelo completo se definió de una vez, incluidas entidades sin interfaz
todavía (blog, incidencias, campañas). Es deliberado: añadir tablas después es
barato, pero reestructurar relaciones con datos reales dentro no lo es.

## Mapa general

```
User ──1:1── GmProfile ──1:N── Campaign ──1:N── Game
 │                │                              │
 │                │                              ├──1:1── SessionNote
 │                │                              ├──1:N── Booking
 │                └──1:N── Payout ──1:N── PayoutItem ──1:1──┘
 │                                                  │
 └──────────────1:N───────────────────── Booking ───┤
                                                    ├──1:N── PaymentEvent
                                                    ├──1:N── Incident
                                                    └──1:1── Review
```

## Decisiones y por qué

### Ser GM no es un campo, es una relación

Un mismo usuario puede ser jugador y game master. En vez de un `role`, ser GM
se representa por **tener un `GmProfile`**. Así el dato de cobro (cuenta de
Stripe, estado del alta) vive donde corresponde y no ensucia `User`, y la
pregunta "¿puede publicar partidas?" tiene una respuesta concreta:
`gmProfile.payoutsEnabled`.

`isAdmin` sí es un booleano en `User`, porque no arrastra datos propios.

### `Campaign` y `Game` son cosas distintas

Una **partida** (`Game`) es una sesión con fecha: lo que se reserva y se paga.
Una **campaña** (`Campaign`) agrupa sesiones ordenadas.

La continuación se modela con `Game.previousGameId`, una autorrelación 1:1. La
regla "solo quien jugó la sesión anterior puede inscribirse en la siguiente"
se resuelve consultando las `Booking` pagadas de `previousGame` — no hay una
lista de invitados que mantener sincronizada, porque **se deriva de quién pagó**.

`SessionNote` guarda las notas de cierre del GM y es la plantilla con la que se
crea la sesión siguiente.

### `Booking` es la unidad de dinero

Todo el desglose económico vive en la reserva, no en la partida:

| Campo             | Qué es                                                 |
| ----------------- | ------------------------------------------------------ |
| `amountCents`     | Lo que pagó el jugador                                 |
| `commissionBps`   | El porcentaje de comisión, decidido al reservar        |
| `origin`          | Por dónde llegó el jugador: la web o el enlace del GM  |
| `commissionCents` | La comisión de TuGameMaster, en céntimos               |
| `stripeFeeCents`  | El coste real de Stripe en esa transacción             |
| `payoutCents`     | `amount − commission − stripeFee`: lo que recibe el GM |

El porcentaje se fija al reservar y los importes **se congelan en el momento
del cobro**. Nunca se recalculan: si mañana la comisión pasa al 12%, las
reservas vendidas al 10% siguen valiendo el 10%. Un porcentaje recalculado al
vuelo reescribe la historia contable.

### `GmProfile.plan`

Estándar o fundador. Es un plan y no un rol: decide la comisión, no lo que el
GM puede hacer. Lo asigna un admin a mano; los porcentajes de cada plan viven
en `modules/payments/dinero.ts` y no en la base de datos.

`stripeFeeCents` se lee de la `balance_transaction` de Stripe, no se estima,
porque TuGameMaster no absorbe los costes de Stripe: se descuentan al GM.

### `PaymentEvent`: el libro de eventos

Esta tabla es la respuesta directa al fallo de la v1, que guardaba el
`PaymentIntent` como un `JSONField` y un `status` de texto libre. El estado del
dinero era invisible.

Aquí cada movimiento (`CHARGE`, `REFUND`, `TRANSFER`, `TRANSFER_REVERSAL`) es
una fila con estado propio, su `stripeId` y su `idempotencyKey` **única**. Esa
unicidad es lo que impide que un reintento del job cobre o transfiera dos
veces: la segunda llamada choca contra la restricción.

`rawPayload` guarda el objeto de Stripe, pero **solo para auditoría**. El
estado válido es el de las columnas.

### `Payout` y `PayoutItem`

Un `Payout` es una transferencia a un GM por una partida (`@@unique` sobre
`gameId`: una partida se paga una sola vez). `PayoutItem` desglosa qué reservas
la componen, de modo que cualquier transferencia puede reconstruirse hasta el
asiento que la originó.

El estado `BLOCKED` con `blockedReason` es lo que permite que una incidencia
abierta detenga el pago sin perder el rastro de por qué se detuvo.

### Reputación que no se puede inflar

`Review` cuelga de una `Booking` concreta (`bookingId` único), no de un par
usuario-GM. Para dejar una reseña tiene que existir una reserva **pagada y
completada**. Es la garantía estructural de que la reputación de un GM solo
puede proceder de partidas gestionadas por la plataforma, como exige
`CLAUDE.md`.

### Sobreventa de asientos

`@@unique([gameId, userId])` en `Booking` impide que el mismo jugador ocupe dos
asientos, y neutraliza el doble clic en el botón de reservar.

**No basta por sí solo**: el control de que no se venden más asientos que
`seatsTotal` se hará en la capa de dominio, dentro de una transacción con
bloqueo de la fila de `Game`. La restricción única cubre el duplicado; la
transacción cubre la carrera entre dos jugadores distintos por la última plaza.

### `ScheduledJob`

Traza de cada ejecución de las tareas de `/api/cron/daily`. El estado vive en
la base de datos, no en un fichero en disco como el `celerybeat-schedule` de la
v1, que era imposible de inspeccionar y se corrompía.

## Borrados

Casi todo lo que toca dinero usa `onDelete: Restrict`. Un `User` con reservas
pagadas **no se puede borrar**, y es intencionado: borrarlo dejaría
transferencias sin origen y descuadraría la contabilidad. Cuando haga falta
atender una baja de cuenta, la solución será anonimizar, no borrar.

`Cascade` se usa solo donde el dato no tiene valor por sí mismo: sesiones,
cuentas OAuth, comentarios, likes y notas de sesión.

## Trabajar con el esquema

```bash
npm run db:migrate      # crea y aplica una migración tras editar el schema
npm run db:seed         # datos de desarrollo (idempotente)
npm run db:studio       # explorador visual de la base de datos
npm run db:generate     # regenera el cliente tipado
```

El cliente se genera en `src/generated/prisma` y **no se versiona**: se
reconstruye en cada `build` y `typecheck`.

### Notas de Prisma 7

- La configuración del CLI está en `prisma7.config.ts`, no en el esquema. Es
  quien carga `.env.local` (el CLI ya no lee ficheros `.env` por su cuenta).
- Las migraciones usan `DIRECT_URL` y el runtime `DATABASE_URL` (pooled). El
  pooler de Neon trabaja en modo transacción y no admite las sentencias del
  motor de migraciones.
- Prisma 7 **exige un driver adapter**: usamos `@prisma/adapter-pg`. Ya no
  existe la opción `datasourceUrl` del constructor.

## Datos de desarrollo

`prisma/seed.ts` crea un escenario navegable: un admin, dos GMs (uno con el
alta de Stripe completada y otro sin ella, para probar el bloqueo de
publicación), cuatro jugadores, una campaña de dos sesiones con nota de cierre,
partidas sueltas, reservas pagadas con su desglose económico, reseñas y una
entrada de blog.

Es idempotente: usa `upsert` sobre campos únicos y puede ejecutarse las veces
que haga falta.

Todos los usuarios sembrados comparten la contraseña **`partida-secreta`**,
guardada como hash argon2id. Solo sirve en local: la base de datos de
producción nunca se siembra.
