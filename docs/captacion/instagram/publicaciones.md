# Las seis primeras publicaciones de Instagram

Para que quien mire el perfil antes de contestar a un mensaje encuentre una
cuenta con vida y con lo mismo que dice la web. **Todo lo que afirman sale de
`/fundadores`, `/para-game-masters` y `/normas`**; si cambia allí, cambia aquí.

**Las comisiones van sin cifras, a propósito** (decidido el 18/11/2026). Se
están ajustando estas primeras semanas y una publicación no se puede corregir
como una página. Lo único que se dice claro es que **no hay comisión por los
jugadores que trae el propio game master** con su enlace; el resto es
«comisión pequeña», «comisión reducida» o «menos que el resto». Las cifras
exactas están en `/fundadores` y `/para-game-masters`, que las leen del código.
Cuando estén cerradas, se publica una aparte con los números.

Reglas que valen para las seis:

- **Ninguna promete reservas, ingresos ni «vivir de esto».** La web es nueva y
  se dice.
- **No se nombra ninguna otra plataforma** ni se comparan tarifas.
- **No se menciona ninguna ciudad.**
- «Son diez plazas» solo mientras sea verdad. Cuando se llene alguna, se
  actualiza la 3 (o se retira).
- El texto de cada imagen va **escrito por nosotros, nunca generado por IA**:
  los modelos de imagen cometen erratas en español. La IA solo se usa, si se
  usa, para fondos sin texto.

## Orden y ritmo

Una publicación cada uno o dos días. Mínimo la 1, la 2 y la 3 **antes** del
primer mensaje: son las que mira un GM para decidir si fiarse.

| Nº  | Tema                                  | Formato       | Para qué sirve                 |
| --- | ------------------------------------- | ------------- | ------------------------------ |
| 1   | Qué es TuGameMaster                   | Carrusel de 3 | Presentarse                    |
| 2   | Cómo cobra un game master             | Carrusel de 5 | El problema que resuelve       |
| 3   | Game masters fundadores               | Carrusel de 4 | La oferta, por escrito         |
| 4   | Por qué existe                        | Carrusel de 4 | Poner cara y dar confianza     |
| 5   | Una reputación que no se puede fingir | Carrusel de 4 | Lo que ganas además del dinero |
| 6   | Pregunta a la comunidad               | Una imagen    | Conversación y datos           |

Formato de todas las imágenes: **1080 × 1350 px (4:5 vertical)**, que es lo que
más ocupa en pantalla.

## Las tarjetas ya hechas

Las genera `scripts/captacion/tarjetas-instagram.mjs` (Chromium de Playwright,
con las fuentes de la web) y salen en `docs/captacion/instagram/tarjetas/`, una
carpeta por publicación y un PNG de 1080 × 1350 por diapositiva. **No se suben
al repositorio**: si cambias un texto, cámbialo en el script y aquí, y vuelve a
ejecutarlo.

```bash
node scripts/captacion/tarjetas-instagram.mjs      # todas
node scripts/captacion/tarjetas-instagram.mjs 3    # solo la publicación 3
```

Diferencias respecto a lo que describen las secciones de abajo, que son el
método manual y los prompts para fondos con IA:

- Las portadas de la 1, la 2 y la 4 llevan una **ilustración que ya tiene la
  web** (`public/marca/portada.png` y `public/blog/tavern-*.webp`) oscurecida;
  la 3 y la 5 llevan el emblema, y la 6 va solo en texto.
- Las dos «capturas» (publicación 2, diapositiva 4, y publicación 5,
  diapositiva 3) están **rehechas con el mismo estilo y las mismas palabras de
  la web**, no recortadas: a tamaño de móvil una captura deja el texto ilegible.
  Muestran el estado vacío de una cuenta nueva (0,00 €, 0 partidas), no cifras
  inventadas.
- La diapositiva 4 de la publicación 4 solo lleva la invitación a contar cómo
  dirigen. **El motivo personal** (el hueco que deja el texto de esa
  publicación) no está en la imagen: si lo quieres, es una diapositiva más que
  escribes tú.

## Cómo se hacen las imágenes a mano

Hay tres tipos de pieza, y solo una puede salir de la IA.

**A. Tarjetas de texto** (la mayoría). Se montan en Canva o similar:

- Fondo liso `#17120e`, o un fondo de la sección «Fondos con IA» oscurecido.
- Título en **Bricolage Grotesque ExtraBold** y texto en **Barlow** (son las
  de la web, gratis en Google Fonts).
- Texto en crema cálido (`#f2e8d5`); lo importante en naranja `#e2622a`; filetes
  y cifras en dorado `#c9973f`.
- Emblema pequeño abajo a la izquierda (`public/marca/logo.svg`) y
  `tugamemaster.com` abajo a la derecha, en las seis.
- Una sola idea por diapositiva; el texto grande (mínimo 48 px de cuerpo).
  Margen de 90 px a cada lado.

**B. Capturas de la web.** Ya existen en `public/blog/` y valen para la 2 y la 5:
`listado-partidas.webp`, `ficha-partida.webp`, `mis-ingresos.webp`,
`perfil-gm.webp`, `pantalla-pago-stripe.webp`. Se colocan dentro de un marco
con esquinas redondeadas, sobre el fondo oscuro. **Mira cada una antes de
subirla**: que no salga ningún correo ni dato de nadie.

**C. Fondos con IA** (opcional, fal.ai). Solo atmósfera: sin texto, sin
personas, sin manos. Un fondo con IA queda **detrás** de una capa negra al
40–60 %, de modo que se note el ambiente y se lea el texto.

### Fondos con IA

Parámetros: tamaño **1080 × 1350** (o 4:5), 4 variantes por prompt y te quedas
con la mejor. Si tu modelo admite «negative prompt», pon en él:
`text, letters, numbers, watermark, logo, people, faces, hands, deformed`.

Mantienen el ambiente cálido a la luz de las velas que ya tienen las imágenes
del blog (`public/blog/tavern-*.webp`).

**Fondo 1 — la mesa (para 1, 4 y 6)**

> Top-down view of a dark wooden tabletop at night, a few polyhedral dice with
> blank faces (one orange d20), a single lit candle, a blank unrolled parchment
> map, warm candlelight, deep shadows, near-black warm brown vignette, large
> empty dark area in the centre for text, rich ember orange and antique gold
> highlights, cinematic, painterly fantasy illustration. No text, no letters,
> no numbers, no people, no hands.

**Fondo 2 — las brasas (para 2, 3 y 5)**

> Abstract embers and glowing sparks rising slowly in the dark, warm orange
> particles on a near-black warm brown background (#17120e), soft smoke, subtle
> and calm, lots of negative space, shallow depth of field. No text, no logos,
> no people.

**Fondo 3 — la silla vacía (para 4)**

> Interior of a candlelit medieval tavern at night, a single empty wooden round
> table in the foreground with a lantern, a closed leather book and a pewter
> tankard, a stone fireplace glowing softly in the background, shallow depth of
> field, warm amber light, heavy dark vignette, painterly fantasy illustration.
> No people, no text, no writing on the book.

**Fondo 4 — el dado (solo para 6)**

> Close-up of a single glowing orange twenty-sided die resting on a dark wooden
> table next to a lit candle, shallow depth of field, near-black background,
> large empty space in the upper half, warm ember light. No numbers on the die,
> no text, no people, no hands.

> **Sobre la IA y esta comunidad.** El rol de mesa tiene muchos ilustradores
> que lo viven mal. Los fondos sin personas ni texto, detrás de una capa
> oscura, pasan casi desapercibidos, pero si alguien pregunta, **se responde
> con la verdad**. Meta puede añadir una etiqueta de «información de IA»; no se
> quita ni se esconde. Si prefieres no arriesgar nada, sirve el fondo liso
> `#17120e`: las tarjetas funcionan igual.

---

## 1. Qué es TuGameMaster

**Carrusel de 3.** Fondo 1 (o liso).

**Diapositiva 1 — portada**

> **Aquí los game masters cobran por dirigir.**
>
> TuGameMaster · partidas de rol online

**Diapositiva 2**

> **Tú pones la mesa.**
> Fecha, plazas y precio.
>
> El jugador reserva y paga con tarjeta. Tú no persigues pagos.

**Diapositiva 3**

> **Estamos empezando.**
> Soy Ulises, el fundador, y busco a los primeros game masters.

**Texto de la publicación**

> TuGameMaster es una web donde los game masters publican sus partidas y cobran
> las plazas por adelantado, con tarjeta.
>
> Es nueva y pequeña. Estoy buscando a los primeros game masters para probarla
> desde el principio.
>
> ¿Diriges mesas y te has cansado de perseguir Bizums? Cuéntame cómo lo haces
> hoy.
>
> tugamemaster.com (enlace en la bio)
>
> #rolenespañol #partidasderol #masterderol #rolonline #dungeonmaster

**Texto alternativo** (accesibilidad): «Tarjeta con el texto: aquí los game
masters cobran por dirigir. TuGameMaster, partidas de rol online.»

---

## 2. Cómo cobra un game master

**Carrusel de 5.** Diapositivas 1, 2, 3 y 5: tarjetas sobre el fondo 2 (o liso).
Diapositiva 4: captura `mis-ingresos.webp` en un marco, con el texto encima o
debajo.

**Diapositiva 1 — portada**

> **¿Cuándo cobra un game master?**
>
> Así funciona, paso a paso.

**Diapositiva 2**

> **1 · El jugador reserva y paga**
> Con tarjeta, en el momento de reservar la plaza.

**Diapositiva 3**

> **2 · El dinero queda retenido**
> La plataforma lo guarda hasta que se juega la partida. Es lo que permite decirle
> al jugador que su dinero está a salvo.

**Diapositiva 4 (con captura de `mis-ingresos`)**

> **3 · Cobras 48 horas después de terminar**
> Si nadie ha reportado ninguna incidencia, la transferencia sale sola a tu
> cuenta.
>
> Lo ves todo en tus ingresos, mesa por mesa.

**Diapositiva 5**

> **¿Y si algo falla?**
> Una incidencia detiene ese pago hasta que se revisa a mano.
>
> Si cancelas tú, quien pagó recupera el 100 % en saldo.
>
> Sin cuota mensual, y sin comisión por los jugadores que traes tú.

**Texto de la publicación**

> Cobrar por una partida no debería ser perseguir a nadie por Bizum.
>
> El jugador paga al reservar, el dinero se retiene, y 48 horas después de
> terminar la partida llega a tu cuenta, si no hay incidencias.
>
> Por los jugadores que traes tú con tu enlace, sin comisión. Por los que llegan
> por la web, una comisión pequeña. Y el coste de la pasarela de pago, que se
> descuenta del cobro. Los detalles, en tugamemaster.com/para-game-masters.
>
> ¿Qué es lo que más te cuesta hoy al cobrar una mesa?
>
> #rolenespañol #partidasderol #masterderol #rolonline #dungeonmaster

**Texto alternativo:** «Carrusel de cinco imágenes sobre cómo cobra un game
master: el jugador paga al reservar, el dinero se retiene, se transfiere 48
horas después de terminar la partida, y qué pasa si hay una incidencia.»

---

## 3. Game masters fundadores

**Carrusel de 4.** Tarjetas sobre el fondo 2 (o liso). Sin cifras de comisión
(ver arriba): la diapositiva 2 va como texto, no como tabla.

**Diapositiva 1 — portada**

> **Buscamos 10 game masters fundadores.**
>
> Comisión reducida, y se queda así.

**Diapositiva 2**

> **Lo que pagan los fundadores**
>
> **Sin comisión** por los jugadores que traes tú con tu enlace.
>
> **Comisión reducida** por los que llegan por la web: menos que el resto de
> game masters.
>
> El coste de Stripe se descuenta siempre del cobro.

**Diapositiva 3**

> **Lo que pactas, se queda.**
> Al nombrarte fundador, tus condiciones quedan fijas: no suben aunque cambie la
> política general. Una reserva ya hecha conserva siempre la comisión con la que
> se vendió.

_Por qué no dice «es permanente» a secas: no se puede prometer que no sube una
cifra que no se ha dado. Lo que sí es verdad es que lo pactado al nombrar a
alguien queda fijo. Por eso no se nombra a nadie hasta cerrar las cifras._

> Sin cuota mensual ni permanencia. Sin exclusividad.

**Diapositiva 4**

> **Lo que no prometemos**
> Ningún número de reservas. La web es nueva: tus jugadores son los primeros
> que llenan tus mesas, y la web irá sumando los suyos.
>
> Las condiciones completas, por escrito: tugamemaster.com/fundadores

**Texto de la publicación**

> Estamos nombrando a los primeros 10 game masters fundadores de
> TuGameMaster.
>
> No pagan comisión por los jugadores que traen ellos con su enlace, y por los
> que llegan por la web pagan una comisión reducida, menor que la del resto de
> game masters. Lo que pactan al entrar se queda, y está todo por escrito.
>
> No prometemos reservas ni ingresos: la web es nueva y lo decimos pronto.
>
> Si diriges mesas y te interesa, escríbeme por mensaje o a contacto@tugamemaster.com.
>
> #rolenespañol #partidasderol #masterderol #rolonline #dungeonmaster

**Texto alternativo:** «Carrusel de cuatro imágenes con las condiciones de los
game masters fundadores: sin comisión por los jugadores que traen ellos y una
comisión reducida por los que llegan por la web.»

---

## 4. Por qué existe

**Carrusel de 4.** Tarjetas con el fondo 3 (la silla vacía) oscurecido. Si
puedes, que la diapositiva 1 lleve una **foto tuya real**, sin filtros.

> **Antes de publicar:** lo que sigue habla de ti. Léelo y cambia lo que no sea
> verdad o no quieras contar. Lo único comprobado por el proyecto es lo del
> intento de hace dos años y lo de rehacerlo desde cero. **El motivo
> personal solo lo puedes poner tú.**

**Diapositiva 1 — portada**

> **Por qué hago esto.**
>
> Soy Ulises y esta es la historia de TuGameMaster.

**Diapositiva 2**

> **Hace dos años lo intenté una primera vez.**
> No funcionó: nunca llegó a ser estable.

**Diapositiva 3**

> **Así que lo rehice desde cero.**
> Con otra base, y con el dinero de las reservas resuelto desde el principio.

**Diapositiva 4**

> **[Tu motivo, en una o dos frases: por qué te importa que los game masters
> cobren por lo que hacen.]**
>
> Si diriges, me gustaría que me contaras cómo lo haces tú.

**Texto de la publicación**

> No hay una empresa grande detrás de TuGameMaster. Hay una persona que quiere
> que los game masters cobren por lo que hacen, sin perseguir a nadie.
>
> Hace dos años lo intenté y no salió bien. Lo he rehecho desde cero y ahora
> estoy buscando a los primeros que quieran probarlo conmigo.
>
> Si diriges mesas, cuéntame cómo lo haces tú: me sirve más que cualquier
> encuesta.
>
> #rolenespañol #partidasderol #masterderol #rolonline #dungeonmaster

**Texto alternativo:** «Carrusel de cuatro imágenes con la historia detrás de
TuGameMaster, sobre una taberna de fantasía iluminada con velas.»

---

## 5. Una reputación que no se puede fingir

**Carrusel de 4.** Diapositivas 1, 2 y 4: tarjetas sobre el fondo 2 (o liso).
Diapositiva 3: captura `perfil-gm.webp` en un marco.

**Diapositiva 1 — portada**

> **Una reseña que no se puede comprar.**

**Diapositiva 2**

> **Solo valora quien jugó.**
> Quien reservó, pagó su plaza y se sentó a la mesa. Nadie más.

**Diapositiva 3 (con captura de `perfil-gm`)**

> **Sin trampas posibles.**
> Hay 60 días desde el final de la partida para valorar, y 14 para corregir la
> reseña antes de que se quede fija.

**Diapositiva 4**

> **Las estrellas y el recuento de partidas de un game master salen solo de
> mesas pagadas en la web.**
>
> Esa reputación es tuya, y nadie puede fingirla.

**Texto de la publicación**

> Las estrellas y las reseñas de un game master en TuGameMaster salen
> exclusivamente de mesas reservadas y pagadas en la web, y solo las deja quien
> jugó de verdad.
>
> Eso hace que tengan valor: no se pueden comprar, ni inflar con amigos que no
> se sentaron.
>
> Además, tu perfil enseña cuánta gente distinta ha pasado por tus mesas y
> cuánta ha repetido. Que alguien vuelva es la señal más honesta que hay.
>
> #rolenespañol #partidasderol #masterderol #rolonline #dungeonmaster

**Texto alternativo:** «Carrusel de cuatro imágenes sobre cómo funcionan las
reseñas en TuGameMaster: solo valora quien reservó, pagó y jugó la partida.»

---

## 6. Pregunta a la comunidad

**Una imagen.** Fondo 4 (el dado) oscurecido, o liso.

**Imagen**

> **Game masters:**
> **¿cómo cobráis hoy vuestras mesas?**
>
> **A** · Bizum
> **B** · PayPal / transferencia
> **C** · No cobro, juego con amigos
> **D** · Otra forma (cuéntala)

**Texto de la publicación**

> Pregunta para quienes dirigís: ¿cómo cobráis hoy las plazas de vuestras mesas?
>
> Responde con una letra en los comentarios (A, B, C o D). Si es la D, cuéntame
> cómo.
>
> Estoy montando una web para esto y lo que me contéis me ayuda a hacerla
> mejor, no a venderos nada.
>
> #rolenespañol #partidasderol #masterderol #rolonline #dungeonmaster

**Texto alternativo:** «Pregunta a los game masters: cómo cobran hoy sus mesas.
Opciones: Bizum, PayPal o transferencia, no cobro, otra forma.»

**Después de publicarla:** contesta a **todos** los comentarios, con una frase
que enlace con lo que han dicho. Una persona que comenta aquí te ha hablado
primero, pero no por eso hay que escribirle un mensaje de captación: sigue
valiendo el criterio de `mensajes.md` (un mensaje, un recordatorio, y si dice
que no, se acabó).

---

## Antes de publicar cada una

- [ ] Las cifras (48 horas, 60 y 14 días, 10 plazas) coinciden con
      `/fundadores`, `/para-game-masters` y la política de reseñas.
- [ ] **Ningún porcentaje de comisión**, salvo que no hay comisión con los
      jugadores propios. «Reducida» y «menos que el resto» siguen siendo
      verdad en la web.
- [ ] Ninguna captura enseña correos ni datos de nadie.
- [ ] El texto de cada diapositiva se lee a tamaño de móvil, sin acercar.
- [ ] El texto alternativo está puesto (Instagram lo pide al publicar, en
      «Opciones avanzadas»).
- [ ] Ningún enlace va acortado, y el único que se pone fuera de la bio es
      `tugamemaster.com/...`.
