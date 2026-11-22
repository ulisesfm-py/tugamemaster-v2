# Reel 1 — Dirige tu primera mesa en 3 pasos

**Para quién:** game masters que todavía no han entrado en la web.
**Qué tienen que saber al acabar:** qué tres cosas hay que hacer, en qué orden,
y que nada se publica hasta que ellos lo deciden.
**Llamada a la acción:** «Enlace en la bio» → `tugamemaster.com/para-game-masters`.

Va primero porque sin partidas no hay nada que reservar: los reels de jugador
vienen después, cuando haya mesas abiertas.

## Formato

- **9:16 vertical, 1080 × 1920**, unos **55 segundos**.
- **Se entiende sin sonido**: todo lo que se dice va también escrito en pantalla.
  La voz es opcional; si no la pones, música suave de fondo.
- **Zona segura:** nada de texto en los 250 px de arriba ni en los 400 px de
  abajo (ahí Instagram pone el nombre, la descripción y los botones).
- Tipografías y colores de la marca, como en las publicaciones: títulos en
  Bricolage Grotesque, texto en Barlow, crema `#f2e8d5` sobre `#17120e`,
  naranja `#e2622a` para lo importante.

## Quién sale

- **Una cuenta nueva, creada mientras se graba** (escenas 3 a 5 y 8 a 9). Así se
  ve lo que vive de verdad quien llega: al registrarse es **jugador**, el menú le
  ofrece «Empezar a dirigir», y hasta que no da de alta los cobros no puede
  publicar. Los campos están en `datos-demo.md`, «Cuenta nueva para el reel 1».
  Se graba en una **ventana privada** del navegador, para no cerrar la sesión de
  Ulises.
- **La cuenta de Ulises** solo para la escena 10, «La cripta bajo el molino» en
  borrador, que ya existe y tiene lámina.
- **Stripe no se graba.** Sus pantallas llevan datos personales, y la cuenta
  nueva **no empieza el alta**. Se cuenta con **dos tarjetas rehechas** (escenas
  6 y 7), como las «capturas» de las publicaciones.

## Antes de grabar

- [ ] **Lámina subida** a «La cripta bajo el molino» (`datos-demo.md`). Sin
      ella, la escena 10 enseña un rectángulo gris con «D&D 5e».
- [ ] **Un correo para la cuenta nueva** que no te importe que salga en el vídeo
      (si no, se difumina al montar). Con Gmail vale un alias:
      `tu.correo+reel@gmail.com` llega a tu bandeja de siempre.
- [ ] **Una contraseña para la cuenta nueva que no uses en ningún otro sitio.**
      No pulses «Ver» mientras grabas.
- [ ] Móvil y web preparados como dice [`grabar-y-montar.md`](grabar-y-montar.md).

## Escenas

| #   | Seg.  | Cuenta | Qué se ve                                                                                                       | Texto en pantalla (y voz)                                                                                             |
| --- | ----- | ------ | --------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| 1   | 0–3   | —      | Portada de la web, bajando despacio hasta las tarjetas de partida.                                              | **Dirige tu primera mesa en TuGameMaster**                                                                            |
| 2   | 3–6   | —      | Tarjeta de texto.                                                                                               | **3 pasos.** Y nada se publica hasta que tú quieras.                                                                  |
| 3   | 6–12  | Nueva  | «Crea tu cuenta»: nombre, email y contraseña; «Crear cuenta»; llega al panel. Acelerado.                        | **1 · Crea tu cuenta** — Al registrarte eres **jugador**: puedes reservar mesas, todavía no dirigirlas.               |
| 4   | 12–21 | Nueva  | Menú › «Empezar a dirigir»: titular, «Cómo diriges», idioma; «Guardar cambios». Acelerado.                      | Pásate a game master: **«Empezar a dirigir»** — Cuenta cómo diriges: es lo que lee quien decide si se sienta contigo. |
| 5   | 21–25 | Nueva  | Arriba de la misma página, «Configurar cobros» › el recuadro de cobros con «Empezar el alta». **No se pulsa.**  | **2 · Dónde cobrar** — Lo gestiona Stripe, no nosotros.                                                               |
| 6   | 25–30 | —      | **Tarjeta rehecha:** tres líneas con icono.                                                                     | Stripe te pedirá: **tus datos**, **tu IBAN** y **una web**.                                                           |
| 7   | 30–35 | —      | **Tarjeta rehecha:** el campo «Sitio web» con `tugamemaster.com/gm/tu-nombre` escrito.                          | Cuando te pida una web, **pon tu perfil de TuGameMaster**. Por eso el perfil va primero.                              |
| 8   | 35–43 | Nueva  | «Nueva partida»: las tres tarjetas, tocar «Fecha fija» y rellenar. Acelerado. **No se pulsa «Crear borrador».** | **3 · Tu primera partida** — Fecha, plazas y precio.                                                                  |
| 9   | 43–47 | Nueva  | Bajar hasta «Quién puede reservar» y marcar «Privada».                                                          | ¿Es tu grupo de siempre? Hazla **privada**, con contraseña.                                                           |
| 10  | 47–51 | Ulises | La gestión de «La cripta bajo el molino»: «Borrador · Todavía no la ve nadie · Publicar».                       | Nace como **borrador**. La publicas cuando esté lista.                                                                |
| 11  | 51–55 | —      | Tarjeta de cierre con el emblema.                                                                               | El jugador paga al reservar. **Tú cobras a partir de 48 h después de jugar.** Enlace en la bio.                       |

**De la escena 9 a la 10 se cambia de cuenta.** Lo único que cambia en pantalla
es el avatar de la cabecera de la web. Si se ve y te molesta, sube el clip 10
hasta dejar la cabecera fuera del encuadre.

## Piezas

En `docs/captacion/reels/tarjetas/01-dirige-tu-primera-mesa/`, generadas con
`node scripts/captacion/tarjetas-reels.mjs 1`:

| Escena  | Archivo                 | Clase                         |
| ------- | ----------------------- | ----------------------------- |
| Portada | `00-portada.png`        | Portada al publicar           |
| 1       | `escena-01-rotulo.png`  | Rótulo sobre la grabación     |
| 2       | `escena-02-tarjeta.png` | Tarjeta (3 s)                 |
| 3       | `escena-03-rotulo.png`  | Rótulo sobre la grabación     |
| 4       | `escena-04-rotulo.png`  | Rótulo sobre la grabación     |
| 5       | `escena-05-rotulo.png`  | Rótulo sobre la grabación     |
| 6       | `escena-06-tarjeta.png` | Tarjeta (5 s)                 |
| 7       | `escena-07-tarjeta.png` | Tarjeta (5 s)                 |
| 8       | `escena-08-rotulo.png`  | Rótulo sobre la grabación     |
| 9       | `escena-09-rotulo.png`  | Rótulo sobre la grabación     |
| 10      | `escena-10-rotulo.png`  | Rótulo sobre la grabación     |
| 11      | `escena-11-tarjeta.png` | Tarjeta (4 s), con el emblema |

## Qué grabar, plano a plano

Siete clips grabados (escenas 1, 3, 4, 5, 8, 9 y 10); el resto son tarjetas. Las
escenas 3 a 9 se graban **seguidas y en orden**, porque cada una deja la cuenta
nueva como la necesita la siguiente.

**Clip 1 — Portada de la web (queda en 3 s).** _Cualquier sesión._
Abre `tugamemaster.com` arriba del todo. Espera 2 s. Desplaza hacia abajo **muy
despacio**, con un solo gesto largo, hasta que se vean las primeras tarjetas de
partida. Para y espera 2 s.
_Montaje:_ ×1,5 si hace falta; el rótulo 1 encima.

**Clip 3 — Crear la cuenta (queda en 6 s).** _Ventana privada, sin sesión._
Abre una **ventana privada** (Safari: pestañas › «Privada»; Chrome: «Nueva
pestaña de incógnito») y entra en `tugamemaster.com/registro`. Empieza a grabar
con el formulario a la vista. Escribe **nombre**, **email** y **contraseña** (los
de `datos-demo.md`); **deja vacío el código de game master** y **no pulses
«Ver»**. Toca **«Crear cuenta»** y espera a que cargue el panel: 2 s quieto.
_Montaje:_ ×3–×4 en lo escrito, ×1 al llegar al panel; el rótulo 3 encima. Si el
email se lee y no quieres que salga, difumínalo (en CapCut, efecto «Desenfoque»
o un recuadro encima).

**Clip 4 — Empezar a dirigir (queda en 9 s).** _Cuenta nueva._
Sigue en el panel. Abre el **menú de la cuenta** (tu avatar, arriba a la derecha)
y para 1 s: se ve **«Empezar a dirigir»** en la lista. Tócalo. En la página
«Empezar a dirigir», para 1 s en el aviso **«Esto no basta para publicar»**.
Rellena **Titular** y **Cómo diriges**, deja marcado **Español** en los idiomas y
escribe **D&D 5e** en «Sistemas que dominas». Toca **«Guardar cambios»**. Aquí
sí se guarda: es lo que convierte la cuenta en game master.
_Montaje:_ ×3–×4 en lo escrito, ×1 en el menú y en el aviso; el rótulo 4 encima.
Si se alarga, corta el texto de «Cómo diriges» a medio escribir: con ver que se
escribe basta.

**Clip 5 — Dónde cobrar (queda en 4 s).** _Cuenta nueva._
Tras guardar, **sube hasta arriba** de la misma página: ahora hay un botón
**«Configurar cobros»**. Tócalo. Llegas a la página de cobros: para 2 s en el
recuadro de arriba, con **«Empezar el alta»**. **No lo pulses**: abriría una
cuenta de Stripe a nombre de esta cuenta de demostración.
_Montaje:_ ×1,5; el rótulo 5 encima.

**Clip 8 — Nueva partida (queda en 8 s).** _Cuenta nueva._
Abre el menú › **«Mis partidas»** › **«Nueva partida»**. Para 1 s en las **tres
tarjetas** (Fecha fija, Fecha flexible, Continuar campaña). Toca **«Fecha
fija»**. Rellena **título, sistema, fecha, plazas y precio** con lo de la
partida 1 de `datos-demo.md` (con esos cinco basta). **No pulses «Crear
borrador».**
_Montaje:_ ×3–×4 en lo escrito; el rótulo 8 encima.

**Clip 9 — Privada (queda en 4 s).** _Cuenta nueva._
En la misma página, desplaza hasta **«Quién puede reservar»**, para 1 s y toca
**«Privada»**: aparece el campo de la contraseña. Para 1 s. Si escribes algo, que
sea inventado para la toma. **No pulses «Crear borrador».**
_Montaje:_ ×1,5; el rótulo 9 encima.

**Clip 10 — La partida en borrador (queda en 4 s).** _Cuenta de Ulises, ventana
normal._
Cierra la ventana privada. En la ventana normal, con tu sesión, abre **«La
cripta bajo el molino»** desde «Mis partidas» **antes de empezar a grabar** (el
menú de tu cuenta enseña «Administración»: que no salga). Que se vea arriba la
lámina, el aviso de **borrador** («Todavía no la ve nadie») y el botón
**«Publicar»**. **No lo pulses.**
_Montaje:_ ×1; el rótulo 10 encima. Un zoom suave hacia «Publicar» queda bien.

**Las tarjetas (escenas 2, 6, 7 y 11):** no se graban; se ponen como imagen con
la duración de la tabla de arriba.

**Duración total:** unos 55 s. Si pasa de 60, recorta el clip 4, que es el más
largo.

**Después de grabar:** la cuenta nueva se queda como game master sin cobros.
No sale en el directorio de game masters (solo salen los verificados) y no
tiene partidas. Apúntala en `datos-demo.md` como hecha.

## Voz (opcional)

Si la pones, es este texto, dicho con naturalidad y sin añadir nada. Cada línea
es una escena:

> 1 · Así diriges tu primera mesa en TuGameMaster.
> 2 · Son tres pasos, y nada se publica hasta que tú quieras.
> 3 · Uno: crea tu cuenta. Al registrarte eres jugador: puedes reservar mesas,
> pero todavía no dirigirlas.
> 4 · Para dirigir, en el menú, «Empezar a dirigir». Cuenta cómo diriges: es lo
> que lee quien decide si se sienta contigo.
> 5 · Dos: dónde cobrar. Lo gestiona Stripe, no nosotros.
> 6 · Stripe te pedirá tus datos, tu IBAN y una web.
> 7 · En la web, pon tu perfil de TuGameMaster. Por eso el perfil va primero.
> 8 · Tres: tu primera partida. Fecha, plazas y precio.
> 9 · ¿Es tu grupo de siempre? Hazla privada, con contraseña.
> 10 · Nace como borrador, y la publicas cuando esté lista.
> 11 · El jugador paga al reservar, y tú cobras a partir de 48 horas después de
> jugar. El enlace, en la bio.

## Texto de la publicación

> ¿Diriges partidas de rol y quieres cobrar las plazas sin perseguir a nadie?
> En TuGameMaster son tres pasos:
>
> 1 · Tu cuenta de game master: al registrarte eres jugador. En el menú,
> «Empezar a dirigir»: cuenta cómo diriges, en qué idiomas, qué sistemas.
> 2 · Dónde cobrar: lo gestiona Stripe. En la web, pon la dirección de tu
> perfil.
> 3 · Tu primera partida: fecha, plazas y precio. Nace como borrador, y la
> publicas cuando quieras. Si es para tu grupo, hazla privada.
>
> El jugador paga al reservar y tú cobras a partir de 48 horas después de
> jugar, si no hay incidencias. Sin cuota mensual y sin comisión por los
> jugadores que traes tú con tu enlace. El coste de la pasarela de pago se
> descuenta del cobro.
>
> La guía completa, en tugamemaster.com/para-game-masters (enlace en la bio).
>
> #rolenespañol #partidasderol #masterderol #rolonline #dungeonmaster

**Texto alternativo:** «Vídeo tutorial de TuGameMaster: cómo crear una cuenta, pasar a
game master, dar de alta los cobros con Stripe y crear la primera partida en
borrador.»

## En la web

El mismo vídeo, **sin música**, encabezando la guía del blog «Dirige tu
primera mesa». El blog admite clips `.mp4` de `public/blog/` (menos de 5 MB, 1280
px de ancho como mucho) o un enlace de YouTube (ver `docs/blog.md`). Para un
vídeo de 55 s, mejor **subirlo a YouTube como Short y enlazarlo**: un clip de
ese largo pasa de los 5 MB. Al tocar la guía, se cambia también la frase de las
48 horas (punto 7 de la auditoría).

## Comprobado contra la web

Cada frase del reel y del texto, y de dónde sale:

| Frase                                                       | Dónde se comprueba                                                        |
| ----------------------------------------------------------- | ------------------------------------------------------------------------- |
| Al registrarte eres jugador; «Empezar a dirigir»            | Menú de una cuenta sin perfil de GM; título de `/cuenta/gm` sin perfil    |
| «Configurar cobros» tras guardar el perfil                  | `/cuenta/gm`: botón cuando hay perfil y no hay cobros                     |
| Nada se publica hasta que tú quieras / nace como borrador   | «Nueva partida»: «Nace como borrador…»; gestión: «Todavía no la ve nadie» |
| Lo gestiona Stripe, no nosotros                             | `/cuenta/cobros`: «El alta la gestiona Stripe, no nosotros»               |
| Stripe pide datos, IBAN y una web                           | Capturas de Ulises del alta, 22/11/2026 (auditoría § 6, B)                |
| Privada, con contraseña                                     | `CLAUDE.md`, partidas privadas                                            |
| Pagas al reservar; cobras a partir de 48 h, sin incidencias | `CLAUDE.md`, flujo del dinero; auditoría, punto 7                         |
| Sin cuota mensual                                           | `/para-game-masters`                                                      |
| Sin comisión por los jugadores que traes con tu enlace      | `/para-game-masters` (0 %). Sin cifra, como manda `publicaciones.md`      |
| El coste de la pasarela se descuenta del cobro              | `CLAUDE.md`: los costes de Stripe se descuentan del pago al GM            |

**Lo que no dice, a propósito:** ningún porcentaje; nada de «en 5 minutos» (la
verificación de Stripe puede tardar días); nada de reservas ni ingresos.
