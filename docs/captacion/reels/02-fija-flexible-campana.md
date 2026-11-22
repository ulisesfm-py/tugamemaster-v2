# Reel 2 — Fecha fija, flexible o campaña

**Para quién:** game masters que ya conocen la web o acaban de ver el reel 1.
**Qué tienen que saber al acabar:** qué hace cada uno de los tres tipos de
partida, y que **ahora, con la web empezando, conviene abrir mesas flexibles**:
no pones fecha a ciegas, la pones cuando ya hay gente.
**Llamada a la acción:** «Enlace en la bio» → `tugamemaster.com/para-game-masters`.

## La idea, en una frase

Con poca gente en la web, una fecha fija es una apuesta: si nadie la reserva, la
mesa se queda vacía. Una mesa flexible le da la vuelta: primero se apunta la
gente que puede en esa franja, y cuando hay bastantes, fijas el día.

## Formato

El mismo del reel 1 (ver [`grabar-y-montar.md`](grabar-y-montar.md)): 9:16,
1080 × 1920, unos **50 segundos**, se entiende sin sonido, zona segura, letras y
colores de la marca.

Este reel es **más de tarjetas que de grabación**: explica un concepto, y la
parte de la web que se ve es poca (el selector y el formulario flexible).

## Antes de grabar

- [ ] **No hace falta crear nada.** Se graba el formulario sin pulsar «Crear
      borrador». Una mesa flexible **no puede ser privada**, así que una de
      demostración publicada quedaría abierta a pre-reservas de verdad.
- [ ] Móvil y web preparados como dice `grabar-y-montar.md`.

## Escenas

| #   | Seg.  | Qué se ve                                                                                  | Texto en pantalla (y voz)                                                                                                                                                                                                  |
| --- | ----- | ------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | 0–3   | «Nueva partida»: las tres tarjetas de arriba.                                              | Fija, **flexible** o campaña: ¿cuál eliges?                                                                                                                                                                                |
| 2   | 3–9   | **Tarjeta:** las tres, una por fila; la flexible, destacada.                               | **Fecha fija:** pones día y hora; se reserva y se paga. **Fecha flexible:** propones una franja; fijas el día cuando hay gente. **Campaña:** la siguiente sesión de una partida ya jugada.                                 |
| 3   | 9–13  | Tocar «Fecha fija» y bajar hasta «Empieza».                                                | **1 · Fecha fija** — Para cuando ya sabes que tienes gente.                                                                                                                                                                |
| 4   | 13–21 | Tocar «Fecha flexible»: marcar «Viernes», hora 19:00, «Mínimo para jugar» en 3. Acelerado. | **2 · Fecha flexible** — Propones una franja, por ejemplo **viernes a las 19:00**, y un mínimo de jugadores.                                                                                                               |
| 5   | 21–26 | **Tarjeta.**                                                                               | Se apunta a quien le **encaja**. Es una pre-reserva: **no se paga nada** todavía. Así sabes quién vendría antes de poner el día.                                                                                           |
| 6   | 26–34 | **Tarjeta:** tres pasos numerados.                                                         | Cuando llegas al mínimo: **te avisamos** · **fijas el día**, con al menos 5 días de margen · **48 h de preferencia**: quien se pre-reservó reserva y paga antes que nadie. Después, las plazas libres son para cualquiera. |
| 7   | 34–38 | **Tarjeta.**                                                                               | Con gente apuntada, el precio **no sube**. Y las plazas no bajan.                                                                                                                                                          |
| 8   | 38–43 | **Tarjeta.**                                                                               | **3 · Campaña** — Nace cuando **continúas** una partida ya jugada. La siguiente sesión solo la reservan quienes jugaron la anterior.                                                                                       |
| 9   | 43–48 | **Tarjeta.**                                                                               | **Un consejo:** ¿Empiezas? **Ve a flexible.** La web es nueva: no pongas fecha a ciegas. Abre una mesa flexible y fija el día cuando ya haya gente.                                                                        |
| 10  | 48–52 | **Tarjeta de cierre** con el emblema.                                                      | Eliges el tipo al crear tu partida. Y puedes tener mesas de los tres a la vez. Enlace en la bio.                                                                                                                           |

## Piezas

En `docs/captacion/reels/tarjetas/02-fija-flexible-campana/`
(`node scripts/captacion/tarjetas-reels.mjs 2`):

| Escena  | Archivo                 | Clase                               |
| ------- | ----------------------- | ----------------------------------- |
| Portada | `00-portada.png`        | Portada al publicar                 |
| 1       | `escena-01-rotulo.png`  | Rótulo sobre la grabación           |
| 2       | `escena-02-tarjeta.png` | Tarjeta (6 s)                       |
| 3       | `escena-03-rotulo.png`  | Rótulo sobre la grabación           |
| 4       | `escena-04-rotulo.png`  | Rótulo sobre la grabación           |
| 5       | `escena-05-tarjeta.png` | Tarjeta (5 s)                       |
| 6       | `escena-06-tarjeta.png` | Tarjeta (8 s): es la que más se lee |
| 7       | `escena-07-tarjeta.png` | Tarjeta (4 s)                       |
| 8       | `escena-08-tarjeta.png` | Tarjeta (5 s)                       |
| 9       | `escena-09-tarjeta.png` | Tarjeta (5 s)                       |
| 10      | `escena-10-tarjeta.png` | Tarjeta (4 s), con el emblema       |

## Qué grabar, plano a plano

Tres clips (escenas 1, 3 y 4), los tres en «Nueva partida». **Ninguno pulsa
«Crear borrador».** Empieza cada uno con la página ya abierta, sin pasar por el
menú de la cuenta (en tu sesión enseña «Administración»).

**Clip 1 — El selector (queda en 3 s).**
Abre «Mis partidas» › «Nueva partida». Empieza a grabar con las tres tarjetas a
la vista (Fecha fija, Fecha flexible, Continuar campaña) y no toques nada: 4–5
segundos quieto.
_Montaje:_ ×1; el rótulo 1 encima. Si el rótulo tapa las tarjetas, baja el clip.

**Clip 3 — Fecha fija (queda en 4 s).**
Toca **«Fecha fija»**. Desplaza despacio hasta el bloque de **«Empieza»**
(fecha, duración, plazas, precio) y para 1 s. No escribas nada: basta con que se
vean los campos.
_Montaje:_ ×1,5–×2; el rótulo 3 encima.

**Clip 4 — Fecha flexible (queda en 8 s).**
Sube y toca **«Fecha flexible»**. Desplaza hasta **«Cuándo, más o menos»**:
**desmarca «Sábado»** (viene marcado) y **marca «Viernes»**; pon la **hora de
inicio en 19:00**. Sigue bajando hasta **«Plazas y precio»** y pon **«Mínimo para
jugar» en 3**. Para 1 s ahí: es lo que explica la tarjeta siguiente.
_Montaje:_ ×2–×3; el rótulo 4 encima.

**Duración total:** unos 50–52 s. Si pasa de 55, la escena 7 se puede quitar: lo
que dice va también en el texto de la publicación.

## Voz (opcional)

> 1 · ¿Fecha fija, flexible o campaña? ¿Cuál eliges?
> 2 · Fecha fija: pones día y hora, y se reserva y se paga. Flexible: propones una
> franja y fijas el día cuando hay gente. Y campaña: la siguiente sesión de una
> partida ya jugada.
> 3 · La fija, para cuando ya sabes que tienes gente.
> 4 · En la flexible propones una franja, por ejemplo los viernes a las siete, y
> un mínimo de jugadores.
> 5 · Se apunta a quien le encaja. Es una pre-reserva: todavía no se paga nada. Así
> sabes quién vendría antes de poner el día.
> 6 · Cuando llegas al mínimo, te avisamos. Fijas el día, con al menos cinco días
> de margen, y quien se pre-reservó tiene cuarenta y ocho horas para reservar
> antes que nadie. Después, las plazas libres son para cualquiera.
> 7 · Y con gente apuntada, el precio no sube ni las plazas bajan.
> 8 · La campaña nace cuando continúas una partida ya jugada: la siguiente sesión
> solo la reservan quienes jugaron la anterior.
> 9 · Un consejo: si empiezas, ve a flexible. La web es nueva: no pongas fecha a
> ciegas. Fija el día cuando ya haya gente.
> 10 · Eliges el tipo al crear tu partida. El enlace, en la bio.

## Texto de la publicación

> ¿Fecha fija, flexible o campaña? Los tres tipos de mesa de TuGameMaster:
>
> · Fecha fija: pones día, hora, plazas y precio. Se reserva y se paga al
> momento.
>
> · Fecha flexible: propones una franja (por ejemplo, viernes por la tarde) y un
> mínimo de jugadores. La gente se pre-reserva sin pagar nada. Cuando llegas al
> mínimo, fijas el día y quien se pre-reservó tiene 48 horas para reservar su
> plaza antes que nadie. Pre-reservarse no obliga: cada uno decide entonces si
> reserva. Y con gente apuntada, el precio no sube ni las plazas bajan.
>
> · Campaña: nace cuando continúas una partida que ya habéis jugado. La siguiente
> sesión solo la pueden reservar quienes jugaron la anterior.
>
> Un consejo ahora que la web está empezando: abre mesas flexibles. No te la
> juegas con una fecha que nadie reserva; la pones cuando ya hay gente.
>
> Más en tugamemaster.com/para-game-masters (enlace en la bio).
>
> #rolenespañol #partidasderol #masterderol #rolonline #dungeonmaster

**Texto alternativo:** «Vídeo tutorial de TuGameMaster: diferencias entre una
partida con fecha fija, una mesa con fecha flexible que se fija al llegar al
mínimo de jugadores, y la continuación de una campaña.»

## En la web

Como el reel 1: Short de YouTube **sin música**, enlazado desde la guía de game
masters del blog, en el apartado de crear partida.

## Comprobado contra la web

| Frase                                                       | Dónde se comprueba                                                                                   |
| ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Las tres definiciones                                       | `cuenta/partidas/nueva/page.tsx`: textos del selector                                                |
| Franja (días, hora, duración) y mínimo de jugadores         | `convocatoria-form.tsx`: «Cuándo, más o menos», «Mínimo para jugar»                                  |
| Pre-reserva sin pagar nada                                  | `CLAUDE.md` (convocatorias); «La gente se pre-reserva sin pagar nada» en «Nueva partida»             |
| Te avisamos al llegar al mínimo                             | `docs/notificaciones.md`: `avisarMinimoAlcanzado`, al game master                                    |
| Al menos 5 días de margen                                   | `convocatorias/politica.ts`: `DIAS_MINIMOS_DE_ANTELACION = 5`                                        |
| 48 h de preferencia; después, cualquiera                    | `convocatorias/politica.ts`: `HORAS_PARA_RESERVAR = 48`, `puedeReservarConvocada`                    |
| Pre-reservarse no obliga                                    | `convocatoria-form.tsx`: «entonces cada uno decide si reserva»                                       |
| El precio no sube, las plazas no bajan                      | `convocatorias/politica.ts`: `problemasAlEditar`                                                     |
| La campaña nace al continuar; solo reservan quienes jugaron | `CLAUDE.md` (historial y campañas); «Nueva partida» › «Continuar campaña»                            |
| Mesas de los tres tipos a la vez                            | Nada lo impide: cada tipo se crea aparte. Para pre-reservarse, el límite es del jugador (5 a la vez) |

**Lo que no dice, a propósito:**

- **«Gratis».** La pre-reserva es «sin pagar nada»; «gratis» se confundiría con
  el precio de la partida (`CLAUDE.md`).
- **Que la flexible garantiza jugadores.** Pre-reservarse no obliga a reservar.
  Por eso el reel dice «sabes quién vendría» y no «ya tienes la mesa llena».
- **Que los jugadores proponen el horario.** La franja la pone el game master;
  el jugador se apunta si le va bien.
