# El flujo del dinero

Este documento describe cómo se mueve el dinero y por qué. Las reglas duras
están en `CLAUDE.md`; aquí está el detalle.

> Estado actual: **implementadas las fases 5, 6 y 7 completa**, más la
> devolución por cancelación del GM (fase 9). El alta de los GMs, el cobro al
> jugador y la transferencia al GM funcionan y están verificados contra Stripe
> en modo test. Lo marcado como _pendiente_ describe lo acordado, no lo que ya
> existe.

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
  − comisión TuGameMaster (según el plan del GM)
  − coste real de Stripe   (de la balance_transaction, nunca estimado)
  ─────────────────────────
  = transferencia al GM
```

Los cuatro valores se **congelan en la reserva** en el momento del cobro. Nunca
se recalculan a partir de porcentajes: si mañana la comisión sube al 12%, las
reservas vendidas al 10% siguen valiendo el 10%. Recalcular al vuelo
reescribiría la historia contable.

### Cuánta comisión

| Plan del GM | Jugador de su enlace | Resto de jugadores |
| ----------- | -------------------- | ------------------ |
| Estándar    | (no tiene enlace)    | 10%                |
| Fundador    | 0%                   | 5%                 |

El porcentaje **se decide al reservar** y se guarda en `Booking.commissionBps`.
No puede decidirse al cobrar: el cobro lo confirma un webhook de Stripe, que
llega desde sus servidores y no sabe nada del jugador, de su navegador ni de
por dónde entró. El webhook aplica lo guardado.

Consecuencia que se acepta a sabiendas: si un admin cambia el plan de un GM
mientras alguien está en la pantalla de pago, esa plaza se vende con lo que se
le ofreció al reservar.

Las reservas anteriores a este cambio se vendieron al 5% y la migración las
dejó con `commissionBps = 500`.

**Los costes de Stripe no los asume TuGameMaster**: se descuentan del pago al
GM, usando el coste exacto que Stripe reporta, no una estimación.

> En un reembolso Stripe no devuelve la comisión del cobro original, y no hay
> pago al GM del que descontarla. La fase 7 zanjó ese problema no devolviendo
> el dinero a la tarjeta: ver [El monedero](#el-monedero-fase-7a-implementado).

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

## Cobro (fase 6, implementado)

El jugador reserva y se le lleva a **Stripe Checkout alojado**. Stripe se
encarga del 3DS, de las carteras móviles, de los idiomas y de la
accesibilidad: en el camino del dinero, cuanto menos código propio, mejor.

La reserva nace en `PENDING` y **ocupa plaza durante 20 minutos**. Pasado ese
plazo deja de contar en el aforo sin que intervenga ningún proceso: es una
condición en la consulta, no un job de limpieza.

### La plaza puede perderse mientras se paga

La sesión de Checkout vive más que esos 20 minutos, así que alguien puede
llegar a pagar cuando su asiento ya lo ocupó otro. Cobrarle sería venderle algo
que no existe, de modo que `registrarCobro` **comprueba el aforo antes de dar
la reserva por buena y reembolsa el importe íntegro** si la plaza ya no está.

Se devuelve todo, incluida la parte que se lleva Stripe: el jugador no tiene
ninguna culpa de haber llegado tarde.

### La `balance_transaction` tarda en aparecer

El coste real de Stripe se lee de la `balance_transaction` del cargo, pero
Stripe la adjunta unos instantes **después** de confirmar el pago, y el webhook
puede llegar antes. Se reintenta cuatro veces con pausas cortas; si aun así no
está, el webhook devuelve 500 y Stripe lo reenvía más tarde, que es
exactamente el comportamiento que queremos.

### Partidas gratuitas

Una partida de 0 € no pasa por Stripe: crear un cobro de cero euros fallaría y
no tendría ningún sentido. La reserva queda pagada en el acto.

## Pago al GM (fase 6, implementado)

El endpoint `/api/cron/daily`, protegido con `CRON_SECRET`, ejecuta cuatro
tareas en orden:

1. **Cerrar partidas**: las publicadas cuya hora de fin ya pasó pasan a
   `COMPLETED`, y sus reservas pagadas también. Esto arranca el reloj de las 48
   horas y es lo que habilita dejar reseña.
2. **Pagar a los GMs**: partidas cerradas hace más de 48 h, sin incidencia
   abierta y con el GM verificado.
3. **Recordar partidas**: a quien juega dentro de las próximas 72 h y aún no ha
   recibido su aviso.
4. **Pedir reseñas**: a quien ya jugó, no ha valorado y sigue en plazo.

Cerrar va primero porque las demás dependen de ello: pagar exige la partida
cerrada, y pedir reseña exige la reserva en `COMPLETED`.

Un pago bloqueado **se puede reintentar**: una incidencia se resuelve y una
cuenta sin verificar acaba verificándose, así que la consulta vuelve a recoger
las partidas cuyo `Payout` quedó en `BLOCKED` o `FAILED`.

### La clave de idempotencia lleva el importe

`payout:<gameId>:<total>`. Si un intento falló y después cambia lo que hay que
transferir, es una operación distinta y necesita clave nueva — Stripe rechaza
reutilizar una clave con otros parámetros.

Que una partida se pague una sola vez lo garantiza el `Payout` con `gameId`
único: la consulta excluye las que ya están `PAID`. La clave es la segunda red,
para que un reintento con el mismo importe devuelva la transferencia original
en lugar de crear otra.

## El monedero (fase 7a, implementado)

Las devoluciones **no vuelven a la tarjeta: se abonan como saldo**. Esa
decisión resuelve de raíz el problema de quién paga la comisión de Stripe en un
reembolso — si el dinero nunca sale, no hay un segundo cobro. La comisión se
pagó al cobrar y ahí se queda.

| Escenario             | El jugador recibe | Efecto para la plataforma                                            |
| --------------------- | ----------------- | -------------------------------------------------------------------- |
| Cancela a más de 48 h | 90% en saldo      | Retiene el 10%, más que suficiente para cubrir lo ya pagado a Stripe |
| El GM no se presenta  | 100% en saldo     | Asume los ~0,72 € de Stripe ya pagados                               |
| El GM cancela la mesa | 100% en saldo     | Asume los ~0,72 € de Stripe ya pagados                               |

El saldo **no caduca**. Solo un administrador puede convertirlo en dinero real,
como válvula de escape ante una reclamación.

### El saldo es una suma, no un contador

`WalletEntry` es un libro de apuntes: positivos abonan, negativos gastan. El
saldo se calcula sumándolos. Un contador guardado acaba desviándose del
historial en cuanto falla una escritura; una suma no puede mentir.

### El orden de los bloqueos importa

Gastar saldo exige bloquear al usuario, y ese bloqueo **se pide antes de
insertar la reserva**. No es un detalle de estilo: insertar una reserva toma un
lock de clave ajena sobre la fila del usuario, así que pedir el bloqueo después
hace que dos reservas simultáneas del mismo usuario intenten ambas subir ese
lock a exclusivo y se queden trabadas. **Es un deadlock real, comprobado.**

### El GM cobra sobre el precio completo

Si parte de la reserva se paga con saldo, el reparto se calcula sobre el
**precio entero**, no sobre lo que entró por tarjeta. Ese dinero ya está en
nuestro balance: procede de un cobro anterior que nunca se devolvió.

Efecto secundario: en una reserva cubierta íntegramente con saldo no hay coste
de Stripe, así que el GM se lleva algo más.

Verificado con una reserva de 15 € pagada con 5 € de saldo y 10 € de tarjeta:
comisión 0,75 € (el 5% de entonces sobre 15 €, no sobre 10 €), coste de Stripe 0,57 € (solo sobre
los 10 € cobrados), 13,68 € transferidos al GM, y la suma cuadra con los 15 €.

## Cancelaciones e incidencias (fase 7b, implementado)

| Situación                        | Resultado                                    |
| -------------------------------- | -------------------------------------------- |
| Cancela a más de 48 h            | **90% en saldo**, plaza liberada             |
| Cancela dentro de las 48 h       | Sin devolución, plaza liberada               |
| Incidencia aprobada por un admin | **100% en saldo**, reserva `REFUNDED`        |
| Incidencia desestimada           | Sin devolución, el pago al GM sigue su curso |
| **El GM cancela la partida**     | **100% en saldo** a todos los que pagaron    |

### Cuando cancela el game master, la política de 48 horas no pinta nada

El plazo existe para proteger al GM de quien se descuelga a última hora. Si
quien se descuelga es él, aplicarlo sería cobrarle al jugador por un plantón
ajeno: se devuelve el **100%**, falte lo que falte para la partida.

Las reservas pagadas pasan a `REFUNDED`; las `PENDING`, que nunca llegaron a
cobrarse, simplemente se cancelan. El GM no cobra nada: el job solo recoge
partidas en `COMPLETED` y esta queda en `CANCELLED`.

Las reglas viven en `modules/bookings/politica.ts`, que es **lógica pura**: son
lo que se anuncia al jugador antes de reservar, así que tienen que poder
comprobarse sin montar nada. El texto de las condiciones sale de ahí también,
para que la web y el código no puedan contradecirse.

Una reserva `PENDING` que nunca llegó a cobrarse no genera devolución: no hay
nada que devolver.

### Una incidencia abierta detiene el dinero

Es su función principal. Mientras está `OPEN`, el job diario marca el `Payout`
de esa partida como `BLOCKED` y no transfiere. Al desestimarla, el bloqueo se
levanta solo: la consulta del job recoge los `Payout` en `BLOCKED`.

No se puede abrir una incidencia si el pago al GM **ya salió**. Ahí la vía
automática se cierra y el caso se trata a mano, porque recuperar dinero ya
transferido es otra conversación.

### Aprobar es irreversible, y por eso se comprueba dos veces

Aprobar abona el 100% y marca la reserva `REFUNDED`. Aprobar dos veces
abonaría dos veces, así que se rechaza si la incidencia ya está resuelta. Y si
el pago al GM salió entretanto, se avisa en lugar de abonar.

Desestimar **exige una explicación**: el jugador tiene derecho a saber por qué.

### Convertir saldo en dinero

Un administrador puede devolver a la tarjeta lo que se cobró con tarjeta. Es la
válvula de escape ante una reclamación de consumo.

Dos condiciones: solo puede devolverse la parte que **realmente pasó por
tarjeta** —lo que se pagó con saldo no tiene a dónde volver—, y el usuario debe
conservar saldo suficiente. Si ya se lo gastó, devolverle además el dinero
sería pagarle dos veces.

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

### Saldo para poder transferir

En modo test, transferir exige que la plataforma tenga fondos disponibles. Se
alimentan cobrando con la tarjeta **4000 0000 0000 0077**, que añade el importe
directamente al saldo disponible.

### Tarjetas útiles

| Tarjeta             | Qué provoca                       |
| ------------------- | --------------------------------- |
| 4242 4242 4242 4242 | Pago correcto                     |
| 4000 0025 0000 3155 | Exige autenticación 3DS           |
| 4000 0000 0000 0002 | Rechazo del banco                 |
| 4000 0000 0000 0077 | Correcto y añade saldo disponible |
