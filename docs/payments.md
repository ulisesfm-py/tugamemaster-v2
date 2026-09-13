# El flujo del dinero

Este documento describe cómo se mueve el dinero y por qué. Las reglas duras
están en `CLAUDE.md`; aquí está el detalle.

> Estado actual: **implementada la fase 5** (alta de los GMs en Stripe
> Connect). Los cobros y los pagos llegan en la fase 6. Las secciones marcadas
> como _pendiente_ describen lo acordado, no lo que ya existe.

## Modelo: separate charges and transfers

TuGameMaster es el **merchant of record**: la plataforma cobra al jugador y el
dinero entra en su balance. Después transfiere al GM lo que le corresponde.

```
jugador ──paga──> balance de TuGameMaster ──transfiere──> GM
                         (retenido)
```

**Por qué no destination charges.** Con esa variante el dinero va directo al
GM en el momento del cobro, y la retención de 48 horas tras la partida —que es
lo que permite atender una incidencia sin haber pagado ya— no existiría. La
ventana de retención es el producto, no un detalle técnico.

Consecuencia para las cuentas conectadas: solo necesitan la capacidad
`transfers`. No aceptan pagos con tarjeta; eso lo hace la plataforma.

## Secuencia

| Momento                       | Qué pasa                                                             |
| ----------------------------- | -------------------------------------------------------------------- |
| El jugador reserva            | Se le cobra **en el acto**, con la tarjeta delante (3DS en pantalla) |
| El dinero                     | Queda retenido en el balance de la plataforma                        |
| 48 h tras terminar la partida | Un job diario transfiere al GM, si no hay incidencia abierta         |

El cobro inmediato elimina toda la rama de cobros off-session: no hay
SetupIntent, ni fallos de autenticación diferidos, ni asientos en el limbo
esperando a que una tarjeta funcione.

**El plazo real del pago al GM está entre 48 y 72 horas**, no exactamente 48.
El cron es diario, así que la partida espera a la siguiente ejecución que
cumpla la condición. Ninguna lógica puede depender del minuto exacto.

## El reparto

```
importe_cobrado
  − comisión TuGameMaster (5%)
  − coste real de Stripe   (de la balance_transaction, nunca estimado)
  ─────────────────────────
  = transferencia al GM
```

Los cuatro valores se **congelan en la reserva** en el momento del cobro. Nunca
se recalculan a partir de porcentajes: si mañana la comisión sube al 7%, las
reservas vendidas al 5% siguen valiendo el 5%. Recalcular al vuelo reescribiría
la historia contable.

**Los costes de Stripe no los asume TuGameMaster**: se descuentan del pago al
GM, usando el coste exacto que Stripe reporta, no una estimación.

> **Decisión pendiente (bloquea la fase 7).** En un reembolso, Stripe no
> devuelve la comisión del cobro original y no hay pago al GM del que
> descontarla. Hay que fijar quién asume ese coste antes de implementar
> cancelaciones y reembolsos.

## Alta de los GMs (fase 5, implementada)

Cuentas **Express**: Stripe se encarga del formulario, los datos fiscales y la
verificación de identidad. TuGameMaster no llega a ver ni a guardar esos datos.

Flujo: `/cuenta/cobros` → se crea la cuenta conectada si no existe → enlace de
alta de Stripe (caduca en minutos, de un solo uso, por eso se genera en cada
visita) → el GM rellena el formulario en stripe.com → vuelve a `/cuenta/cobros`.

### `payouts_enabled` es la única señal que cuenta

Un GM puede haber **terminado el formulario** (`details_submitted: true`) y
seguir sin poder cobrar, porque Stripe aún está verificando. Si nos fiáramos de
`details_submitted`, dejaríamos publicar partidas que después no se podrían
pagar. El gate para publicar es `payouts_enabled`, y solo ese.

`onboardedAt` se escribe **una sola vez**, la primera vez que la cuenta queda
habilitada: es la fecha de alta, no la del último cambio.

### Los webhooks son la fuente de verdad

El estado de una cuenta cambia por su cuenta: Stripe puede completar una
verificación horas después, o pedir documentación adicional más adelante. Eso
solo llega por `account.updated`.

La página de cobros ofrece además un botón de «Comprobar estado» que relee
Stripe directamente. No sustituye al webhook: existe porque el webhook puede
tardar unos segundos y sería raro que la página siguiera diciendo que falta
algo ya resuelto.

### Reglas del endpoint de webhooks

- **La firma se verifica siempre.** Sin eso, cualquiera podría marcar su cuenta
  como verificada con un POST. Está comprobado que una firma falsificada o
  ausente devuelve 400.
- El cuerpo se lee **en crudo**: cualquier reserialización cambia los bytes y
  la firma deja de cuadrar.
- Un evento de una cuenta desconocida **no es un error**: se responde 200 para
  que Stripe no reintente indefinidamente.
- Un fallo nuestro al procesar **sí** devuelve 500, porque ahí el reintento de
  Stripe es justo lo que queremos.

## Reglas que no se negocian

- Importes como **enteros en céntimos** más código de moneda. Nunca float.
- Cada movimiento de dinero es **una fila con estado explícito** en
  `PaymentEvent`, con `stripeId` e `idempotencyKey` únicos. Prohibido guardar
  el objeto de Stripe como JSON opaco y derivar el estado de él: ese fue el
  error de la v1.
- Todo job de cobro o transferencia es **idempotente**: ejecutarlo dos veces no
  puede pagar dos veces. La unicidad de `idempotencyKey` es lo que lo garantiza.
- **Stripe solo se invoca desde `src/modules/payments`.** Ningún otro módulo
  importa el SDK.

## Probar en local

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

La CLI imprime un `whsec_...` distinto del de producción: ese es el que va en
`.env.local`.

Para simular el alta de un GM sin rellenar el formulario:

```bash
stripe trigger account.updated
```

Las cuentas de prueba de Connect se verifican al instante en modo test.
