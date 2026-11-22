# Reel 3 — Organiza a tu grupo de siempre

**Para quién:** game masters que ya juegan con un grupo fijo y no cobran.
**Qué tienen que saber al acabar:** que pueden usar la web **gratis** para
organizar sus partidas de siempre: partida privada, a 0 €, y les pasan la
contraseña a los suyos.
**Llamada a la acción:** «Enlace en la bio» → `tugamemaster.com/para-game-masters`.

**Por qué nos interesa:** cada mesa privada sale en el listado con su etiqueta,
así que la web enseña actividad. Y sus jugadores se crean una cuenta, que es la
puerta para que un día reserven otras mesas.

## Antes de publicar este reel: dos decisiones

Al comprobar el guion contra el código salen dos cosas que **cambian lo que el
reel puede prometer**. No las he tocado; decides tú.

**1. Para publicar una partida a 0 € hay que tener los cobros dados de alta.**
`publicarPartida` exige `payoutsEnabled` siempre, cobre o no
(`games/service.ts`). Un game master que solo quiere organizar a su grupo tiene
que pasar igualmente por Stripe (datos, IBAN, web) para algo en lo que no va a
cobrar nada. Además, si lo intenta sin ellos, ve el mensaje viejo «Ese paso
llegara con la integracion de cobros» (auditoría, R).

- **Si se deja así**, el reel lo dice en la tarjeta final («Antes de publicar: tu
  perfil de game master y los cobros dados de alta») y funciona. Pero espanta a
  justo la gente a la que va dirigido.
- **Si se cambia** (publicar sin cobros cuando la partida es a 0 €), el reel puede
  decir «sin Stripe y sin dar tu cuenta». Es un cambio pequeño en
  `publicarPartida`, con su prueba. Lo que no se debe permitir es **subirle el
  precio** después sin cobros: ahí sí hace falta.

**Mi recomendación:** cambiarlo antes de publicar el reel. Es la diferencia entre
«regístrate y crea la partida» y «regístrate, date de alta en Stripe con tu IBAN
y crea la partida».

**2. Las partidas a 0 € cuentan para la reputación.**
Una reserva a 0 € queda `PAID` como cualquier otra. Por eso suma en «Partidas
dirigidas» (`profiles/queries.ts`, `reputacionGm`) y **da derecho a reseña**
(`reviews/politica.ts`, `puedeValorar`). Si animamos a los game masters a jugar
gratis con sus amigos, **sus amigos podrán ponerles cinco estrellas**. Eso choca
con lo que dice la web y con la publicación 5 («Una reseña que no se puede
comprar»; «únicamente valora quien pagó su plaza aquí»).

- **Opción A:** las partidas a 0 € **no dan reseña ni cuentan** en la
  reputación. Coherente con «solo valora quien pagó», y simple de explicar.
- **Opción B:** cuentan, pero el perfil las separa («de ellas, X gratuitas»).
  Más trabajo, y sigue dejando que tus amigos te pongan estrellas.

**Mi recomendación:** la A, antes de publicar el reel. Y añadir una línea a la
explicación de «Lo que certificamos»: «Solo cuentan las partidas de pago».

Mientras no se decidan, el guion de abajo **no dice nada de reputación ni de
reseñas**, y su tarjeta final avisa de los cobros, que es lo que hace hoy la web.

## Formato

El de siempre (ver [`grabar-y-montar.md`](grabar-y-montar.md)): 9:16,
1080 × 1920, unos **35 segundos**, se entiende sin sonido.

## Antes de grabar

- [ ] **Partida 2 de `datos-demo.md` creada y publicada**: privada, a 0 €. La
      escena 1 la enseña en el listado. **Se retira al acabar de grabar.**
- [ ] Desplegado el cambio de la decisión 1, si se hace (y entonces se cambia
      la tarjeta 7).
- [ ] Móvil y web preparados como dice `grabar-y-montar.md`.

## Escenas

| #   | Seg.  | Qué se ve                                                                                           | Texto en pantalla (y voz)                                                                                                                                              |
| --- | ----- | --------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | 0–3   | `/partidas`, bajando hasta la tarjeta de «El último tren de Valdeniebla» con su etiqueta «Privada». | ¿Juegas con tu grupo de **siempre**? Organizadlo aquí, sin coste.                                                                                                      |
| 2   | 3–9   | **Tarjeta.**                                                                                        | Una partida **privada**, a 0 €. No le cuesta nada a nadie: ni a ti ni a tus jugadores. Sale en el listado como «Privada», pero solo reserva quien tenga la contraseña. |
| 3   | 9–17  | «Nueva partida» › «Fecha fija»: precio **0** y «Privada» con la contraseña. Acelerado.              | **1 · Precio 0 € y «Privada»** — La contraseña la eliges tú.                                                                                                           |
| 4   | 17–21 | La gestión de la partida: el recuadro de la contraseña con «Copiar contraseña».                     | **2 · Pásales el enlace y la contraseña** — La tienes siempre en la gestión de la partida.                                                                             |
| 5   | 21–26 | **Tarjeta:** tres filas con icono.                                                                  | Y lo demás va solo: **quién viene**, el **hilo de mesa** para hablar con tus jugadores y un **recordatorio** por correo unos días antes.                               |
| 6   | 26–31 | **Tarjeta.**                                                                                        | **Un truco:** que se creen la cuenta con **tu enlace**. Quedan como jugadores tuyos: el día que cobres una mesa, por ellos no pagas comisión.                          |
| 7   | 31–35 | **Tarjeta de cierre** con el emblema.                                                               | Tus mesas, en un solo sitio. Antes de publicar: tu perfil de game master y los cobros dados de alta. Enlace en la bio.                                                 |

## Piezas

En `docs/captacion/reels/tarjetas/03-tu-grupo-aqui/`
(`node scripts/captacion/tarjetas-reels.mjs 3`):

| Escena  | Archivo                 | Clase                         |
| ------- | ----------------------- | ----------------------------- |
| Portada | `00-portada.png`        | Portada al publicar           |
| 1       | `escena-01-rotulo.png`  | Rótulo sobre la grabación     |
| 2       | `escena-02-tarjeta.png` | Tarjeta (6 s)                 |
| 3       | `escena-03-rotulo.png`  | Rótulo sobre la grabación     |
| 4       | `escena-04-rotulo.png`  | Rótulo sobre la grabación     |
| 5       | `escena-05-tarjeta.png` | Tarjeta (5 s)                 |
| 6       | `escena-06-tarjeta.png` | Tarjeta (5 s)                 |
| 7       | `escena-07-tarjeta.png` | Tarjeta (4 s), con el emblema |

Si se hace el cambio de la decisión 1, la tarjeta 7 pasa a decir «Sin dar de
alta los cobros: solo tu perfil de game master» (se cambia en el generador y en
esta tabla a la vez).

## Qué grabar, plano a plano

Tres clips (escenas 1, 3 y 4). Empieza cada uno con la página ya abierta, sin
pasar por el menú de la cuenta.

**Clip 1 — El listado (queda en 3 s).**
Abre `tugamemaster.com/partidas`. Empieza a grabar arriba y desplaza despacio
hasta que se vea entera la tarjeta de **«El último tren de Valdeniebla»**, con
**«Privada»** y **0,00 €**. Para 2 s.
_Montaje:_ ×1,5; el rótulo 1 encima. Si la tarjeta queda debajo del rótulo,
sube el clip.

**Clip 3 — Precio 0 y privada (queda en 8 s).**
«Mis partidas» › «Nueva partida» › **«Fecha fija»**. Desplaza hasta **«Precio por
plaza (€)»** y escribe **0**. Sigue hasta **«Quién puede reservar»**, toca
**«Privada»** y escribe una contraseña inventada para la toma (por ejemplo,
`tren2340`). **Para sin pulsar «Crear borrador».**
_Montaje:_ ×2–×3; el rótulo 3 encima.

**Clip 4 — La contraseña (queda en 4 s).**
Abre la gestión de **«El último tren de Valdeniebla»** desde «Mis partidas».
Desplaza hasta el recuadro de la contraseña («Sale en el listado con la etiqueta
«Privada»…») y para 2 s en **«Copiar contraseña»**. Si la contraseña real de la
partida se lee, **difumínala en el montaje** o usa una que no te importe enseñar.
_Montaje:_ ×1; el rótulo 4 encima.

## Voz (opcional)

> 1 · ¿Juegas con tu grupo de siempre? Organizadlo aquí, sin coste.
> 2 · Una partida privada, a cero euros. No le cuesta nada a nadie. Sale en el
> listado como privada, pero solo reserva quien tenga la contraseña.
> 3 · Pones el precio a cero, la marcas como privada y eliges la contraseña.
> 4 · Les pasas el enlace y la contraseña. La tienes siempre en la gestión de la
> partida.
> 5 · Y lo demás va solo: quién viene, el hilo de mesa para hablar y un
> recordatorio por correo unos días antes.
> 6 · Un truco: que se creen la cuenta con tu enlace. El día que cobres una mesa,
> por ellos no pagas comisión.
> 7 · Tus mesas, en un solo sitio. El enlace, en la bio.

## Texto de la publicación

> ¿Juegas con tu grupo de siempre? Puedes organizarlo en TuGameMaster sin que le
> cueste nada a nadie.
>
> Crea la partida con precio 0 € y márcala como privada. Sale en el listado con la
> etiqueta «Privada», pero solo puede reservar quien tenga la contraseña que tú
> eliges. Pásales el enlace y la contraseña a los tuyos, y la web lleva la lista
> de quién viene, el hilo de mesa para hablar y un recordatorio por correo antes
> de jugar.
>
> Un truco: pásales tu enlace de invitación para que se creen la cuenta con él (lo
> tienes en tu panel). Quedan como jugadores tuyos, y el día que cobres una mesa,
> por ellos no pagas comisión.
>
> Para publicar necesitas tu perfil de game master y los cobros dados de alta,
> como en cualquier partida.
>
> Más en tugamemaster.com/para-game-masters (enlace en la bio).
>
> #rolenespañol #partidasderol #masterderol #rolonline #dungeonmaster

(Si se hace el cambio de la decisión 1, el penúltimo párrafo pasa a «Para
publicar solo necesitas tu perfil de game master».)

**Texto alternativo:** «Vídeo tutorial de TuGameMaster: cómo crear una partida
privada con precio cero para organizar las partidas de un grupo de juego, con
contraseña para reservar.»

## Comprobado contra la web

| Frase                                                      | Dónde se comprueba                                                                                   |
| ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Precio 0 € admitido                                        | `games/schema.ts`, `precioEnEuros`: «no puede ser negativo»; el 0 vale                               |
| No le cuesta nada a nadie                                  | `bookings/service.ts`: sin nada que cobrar no se pasa por Stripe; sin cobro no hay comisión ni coste |
| Sale en el listado como «Privada»; solo con contraseña     | `CLAUDE.md` (partidas privadas); `partida-form.tsx`, opción «Privada»                                |
| La contraseña, siempre en la gestión                       | `cuenta/partidas/[gameId]/page.tsx`: recuadro con «Copiar contraseña»                                |
| Quién viene                                                | La gestión de la partida lista las reservas                                                          |
| Hilo de mesa                                               | `threads/politica.ts`: GM y quien tenga plaza confirmada                                             |
| Recordatorio por correo unos días antes                    | `notifications/tareas.ts`: reservas `PAID` (las de 0 € lo son), ventana de 72 h                      |
| Con tu enlace, jugadores tuyos; sin comisión cuando cobres | `CLAUDE.md` (código de invitación, 0 %); el enlace sale en «Mi panel» y «Mis ingresos». Sin cifra    |
| Hacen falta perfil y cobros para publicar                  | `games/service.ts`, `publicarPartida` (decisión 1)                                                   |

**Lo que no dice, a propósito:**

- **Nada de reseñas ni reputación** (decisión 2).
- **Que no se ve.** Una privada sí sale en el listado; lo que no se puede es
  reservar sin la contraseña.
- **Que el enlace de invitación vale para siempre.** Admite registros durante 3
  meses (se renueva); lo que no caduca es el emparejamiento. Para un reel basta
  con «tu enlace».
- **Que una cuenta que ya existe se empareja.** No se empareja nunca: por eso el
  truco es que **se creen la cuenta** con tu enlace.
