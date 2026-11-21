# Avisos: qué se avisa, a quién y por dónde

La web avisa por dos caminos, y **no son el mismo aviso en dos sitios**:

- **Correo** (Resend). Cuenta **algo que acaba de pasar**: se envía una vez y
  no se puede «desleer». Código: `src/modules/notifications/service.ts` (los que
  dispara una acción) y `tareas.ts` (los del cron diario). Textos en
  `plantillas.ts`.
- **Campana** (dentro de la web, y el bloque «Te toca hacer» del panel). Dice
  **algo que es verdad ahora**: no se guarda, se calcula cada vez y desaparece
  solo cuando deja de ser cierto (al valorar, al fijar la fecha, al reservar…).
  Código: `src/modules/notifications/avisos.ts`.

Un correo que falla **no rompe** lo que lo provoca (`sinRomper`): el cobro, la
cancelación o el nombramiento siguen adelante. Sin `RESEND_API_KEY`, los correos
se vuelcan al registro.

Actualizado el 21/11/2026 a partir del código. Si se añade un aviso, se añade
aquí.

## Correos (11)

| Cuándo                                                         | A quién                  | Función                    |
| -------------------------------------------------------------- | ------------------------ | -------------------------- |
| Se confirma el pago de una plaza (o una plaza sin coste)       | Jugador                  | `avisarReservaConfirmada`  |
| Se confirma el pago de una plaza en su partida                 | Game master              | `avisarNuevaReserva`       |
| El game master cancela una partida con gente dentro            | Cada jugador con plaza   | `avisarPartidaCancelada`   |
| Un admin resuelve una incidencia (aprobada o rechazada)        | Jugador que la abrió     | `avisarIncidenciaResuelta` |
| Un admin le nombra fundador (con su código y su enlace)        | Game master              | `avisarFundadorNombrado`   |
| Sale la transferencia de una partida                           | Game master              | `avisarPagoEnviado`        |
| Una mesa con fecha flexible llega al mínimo de pre-reservas    | Game master              | `avisarMinimoAlcanzado`    |
| El GM cierra una mesa flexible sin fijar fecha                 | Cada pre-reservado       | `avisarMesaCerrada`        |
| El GM fija la fecha de una mesa flexible (empiezan las 48 h)   | Cada pre-reservado       | `avisarMesaConvocada`      |
| **Cron:** su partida empieza en las próximas 72 h              | Jugador con plaza pagada | `recordarPartidas`         |
| **Cron:** la partida se cerró y aún no ha valorado (≤ 60 días) | Jugador                  | `pedirResenas`             |

Los dos del cron se envían **una sola vez** por reserva (marca
`reminderSentAt` / `reviewRequestSentAt`), aunque fallen.

## Campana (13)

| Aviso                                                      | A quién               | Desaparece cuando…                  |
| ---------------------------------------------------------- | --------------------- | ----------------------------------- |
| «Valora <partida>»                                         | Jugador               | valora, o pasan los 60 días         |
| «Aprobamos / Revisamos tu incidencia en <partida>»         | Jugador               | pasan 7 días desde que se resolvió  |
| «<mesa> ya tiene fecha: reserva tu plaza»                  | Pre-reservado         | reserva, o vencen sus 48 h          |
| «Configura tu cuenta de cobro para poder publicar»         | Game master           | Stripe verifica su cuenta           |
| «Hay una incidencia abierta en <partida>»                  | Game master           | un admin la resuelve                |
| «Tu pago de <partida> está retenido» (bloqueado o fallido) | Game master           | la transferencia sale               |
| «Alguien se ha apuntado a <partida>» / «N plazas nuevas»   | Game master           | pasan 7 días, o se juega la partida |
| «Anota cómo acabó <partida>»                               | Game master           | escribe la nota, o pasan 7 días     |
| «<mesa> ya tiene el mínimo: fija la fecha»                 | Game master           | fija la fecha o cierra la mesa      |
| «Un mensaje nuevo / N mensajes nuevos en <partida>»        | Cualquiera en el hilo | lee el hilo                         |

(Algunas filas agrupan dos textos, por eso son 10 filas y 13 avisos.)

## Lo que **no** se avisa por ningún camino

Conviene saberlo antes de prometerlo en un vídeo o en un mensaje:

- **Que un jugador libere su plaza.** El GM no recibe correo ni campana: lo ve
  en el aforo de la partida.
- **Que alguien se pre-reserve** en una mesa flexible, hasta llegar al mínimo.
- **Que Stripe verifique la cuenta de cobro.** La campana deja de pedirlo, pero
  no hay correo de «ya puedes publicar» (propuesta 6 de
  `docs/captacion/mejoras-web.md`).
- **Mensajes del hilo por correo.** Es una decisión: el hilo solo avisa en la
  campana.
- **A los administradores**, de nada: una incidencia nueva no avisa a nadie del
  equipo; se ve al entrar en la administración.
- **Recuperar la contraseña.** No existe: no hay correo de «he olvidado mi
  contraseña».
