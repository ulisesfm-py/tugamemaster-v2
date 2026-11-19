-- Corrige la hora de las partidas creadas antes de leer los formularios en
-- hora peninsular (ver src/lib/hora.ts).
--
-- El campo de fecha del formulario no lleva zona, y el servidor (UTC en
-- Vercel) lo leia en UTC: quien escribio las 18:00 guardo las 18:00 UTC, que
-- son las 19:00 de Madrid en invierno y las 20:00 en verano. La web lo
-- disimulaba porque tambien ensenaba la hora en UTC; los correos, que ya iban
-- en hora de Madrid, no.
--
-- Cada fecha guardada se reinterpreta como la hora de reloj de Madrid que el
-- GM escribio, y se vuelve a guardar en UTC. Las columnas son TIMESTAMP sin
-- zona con valores UTC:
--
--   ("startsAt" AT TIME ZONE 'Europe/Madrid')  -> ese reloj leido en Madrid
--   ... AT TIME ZONE 'UTC'                      -> el instante, otra vez en UTC
--
-- Vale para todas las partidas de produccion, que nunca se siembra: todas
-- salieron del formulario. En una base de desarrollo sembrada, las partidas
-- del seed ya tenian la hora bien y quedan una o dos horas antes; basta con
-- volver a sembrar.
--
-- Las mesas con fecha flexible no se tocan: su franja ya se guarda como hora
-- de reloj (minutos desde medianoche), no como instante.

UPDATE "Game"
SET
  "startsAt" = ("startsAt" AT TIME ZONE 'Europe/Madrid') AT TIME ZONE 'UTC',
  "endsAt" = ("endsAt" AT TIME ZONE 'Europe/Madrid') AT TIME ZONE 'UTC';
