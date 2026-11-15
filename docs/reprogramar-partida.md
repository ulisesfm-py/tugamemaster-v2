# Reprogramar una partida con jugadores (pendiente, sin implementar)

**Estado: aparcado a propósito.** Ulises lo hablará con los game masters
fundadores para ver si lo quieren ya. No se construye hasta entonces. Este
documento es la nota para no perder lo que se pensó (13/11/2026).

## Qué pasa hoy

**La fecha de una partida con plazas ocupadas no se puede cambiar.** La regla
está en `src/modules/games/politica.ts` y la hace cumplir `actualizarPartida`
(`src/modules/games/service.ts`); el formulario de edición enseña la fecha como
texto con una explicación. Cuenta como ocupada una plaza pagada, jugada o que
alguien está pagando ahora mismo, y también las gratuitas.

Lo demás de la ficha sigue editándose: título, descripción, precio (las plazas
ya pagadas conservan el que pagaron), plazas (sin bajar de las ocupadas),
idiomas, etiquetas, **y la duración** (ver «Cabos sueltos»).

Salida actual para un imprevisto: el game master escribe a Ulises, que decide
caso por caso. Cancelar la mesa y crear otra funciona, pero **te cuesta dinero**
(ver más abajo).

## Por qué no basta con permitir el cambio sin más

Se probó el razonamiento con el código y salieron tres problemas:

1. **Nadie se entera.** Cambiar la fecha no manda ni correo ni aviso. El hilo de
   mesa no manda correos, y quien reservó no tiene por qué mirarlo.
2. **El plazo de cancelación se desplaza.** La devolución del 90 % depende de
   que falten más de 48 h para la fecha vigente. Adelantar la partida puede
   dejar a un jugador sin devolución sin que lo sepa.
3. **La alternativa, cancelar y recrear, la paga la plataforma.** `cancelarPartida`
   devuelve el 100 % en saldo y no hay pago al GM del que descontar la comisión
   de Stripe de cada plaza. Con una tarjeta europea son unos 0,48 € de
   procesamiento más 0,05 € de Radar (si se sigue en el plan Standard) en una
   plaza de 15 €: **~2,60 € por una mesa de 5**. El dinero del saldo no se
   pierde, pero la comisión ya pagada no se recupera.

## Propuesta: «Reprogramar» con aviso y cancelación gratuita

Un flujo explícito en la ficha de la partida (no en el formulario general):

1. **El GM propone la fecha nueva.** Reglas: al menos 2 h desde ahora (ya existe)
   y, si hay jugadores, **a más de 48 h de ahora**, para no dejar a nadie dentro
   del plazo sin enterarse. Máximo de reprogramaciones por partida: a decidir (1
   o 2).
2. **Aviso a cada jugador con plaza:** correo (plantilla pura en
   `src/modules/notifications/plantillas.ts`, con su versión de texto y el HTML
   escapado) más campanita. Ojo: los avisos de la campanita se **derivan**, no
   se guardan; para «fecha cambiada» hace falta un dato persistente (por
   ejemplo `Game.rescheduledAt` y la fecha anterior). Es una migración, y tiene
   que ser compatible hacia atrás porque producción migra sola.
3. **Ventana de cancelación gratuita:** durante unos días desde el aviso (72 h
   como punto de partida), el jugador que no pueda ir recupera el **100 % en
   saldo**, no el 90 %. `cancelarReserva` tendría que mirar si la partida se
   reprogramó hace menos de esa ventana.
4. **El coste:** solo lo generan los que se van, que serán minoría. Sigue siendo
   comisión de Stripe que absorbe la plataforma (ver «Decisiones»).
5. **El recordatorio tiene que volver a salir.** El aviso de «tu partida está al
   caer» se marca en **cada reserva** con `reminderSentAt` y no se reenvía. Al
   reprogramar hay que ponerlo a nulo en las reservas de esa partida (y mirar
   `reviewRequestSentAt`), o el recordatorio de la fecha nueva no sale.
6. **Mensaje en el hilo** de la mesa, automático, para dejar constancia.

## Decisiones para hablar con los fundadores

- ¿Quieren poder reprogramar, o les basta con escribir a Ulises?
- Ventana de cancelación gratuita y número máximo de reprogramaciones.
- **Quién asume la comisión de Stripe de quien se va:** la plataforma (hoy), o se
  descuenta del próximo pago del GM. Descontarla es lo coherente con la regla de
  `CLAUDE.md` («los costes de Stripe nunca los asume TuGameMaster»), pero un GM
  sin más pagos pendientes no tiene de dónde descontar, y hay que explicarlo
  como condición.
- ¿Se permite reprogramar una mesa que empieza en menos de 48 h? Hoy se
  propone que no.

## Cabos sueltos que conviene cerrar al construirlo

- **La duración también mueve el horario** (hora de fin → cuándo se paga al GM) y
  hoy sigue siendo editable con plazas ocupadas. Hay que decidir si se bloquea
  junto con la fecha o si forma parte de «reprogramar».
- **Zona horaria, sin verificar.** El formulario manda la hora sin zona
  (`datetime-local`), `z.coerce.date` la interpreta en la zona del servidor
  (UTC en Vercel, a comprobar) y las páginas la imprimen sin zona, pero los
  correos la formatean en `Europe/Madrid` (`plantillas.ts`). Si es así, la hora
  del correo y la de la web difieren en 1–2 h, y el plazo de 48 h se cuenta
  sobre una hora desplazada. **Comprobarlo con una partida y su correo antes de
  construir nada que dependa de horas exactas.**
- Tests: política pura de la ventana, plantilla del correo y la regla de las 48 h
  (Vitest). Sin tocar la base de producción: `.env.local` apunta a ella.
