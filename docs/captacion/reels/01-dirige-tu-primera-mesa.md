# Reel 1 — Dirige tu primera mesa en 3 pasos

**Para quién:** game masters que todavía no han entrado en la web.
**Qué tienen que saber al acabar:** qué tres cosas hay que hacer, en qué orden,
y que nada se publica hasta que ellos lo deciden.
**Llamada a la acción:** «Enlace en la bio» → `tugamemaster.com/para-game-masters`.

Va primero porque sin partidas no hay nada que reservar: los reels de jugador
vienen después, cuando haya mesas abiertas.

## Formato

- **9:16 vertical, 1080 × 1920**, unos **45 segundos**.
- **Se entiende sin sonido**: todo lo que se dice va también escrito en pantalla.
  La voz es opcional; si no la pones, música suave de fondo.
- **Zona segura:** nada de texto en los 250 px de arriba ni en los 400 px de
  abajo (ahí Instagram pone el nombre, la descripción y los botones).
- Tipografías y colores de la marca, como en las publicaciones: títulos en
  Bricolage Grotesque, texto en Barlow, crema `#f2e8d5` sobre `#17120e`,
  naranja `#e2622a` para lo importante.

## Quién sale

- **La cuenta de Ulises** para todo lo que hace el game master. Es el fundador y
  las publicaciones ya le ponen cara.
- **Stripe no se graba.** Sus pantallas llevan datos personales, y la cuenta de
  Ulises ya está verificada. Se cuenta con **dos tarjetas rehechas** (escenas 5 y
  6), como las «capturas» de las publicaciones.

## Antes de grabar

- [ ] **Desplegado el commit `2c60ddf`** (idiomas en casillas): la escena 3 los
      enseña.
- [ ] **Lámina subida** a «La cripta bajo el molino» (`datos-demo.md`). Sin
      ella, la escena 9 enseña un rectángulo gris con «D&D 5e».
- [ ] Móvil en modo «No molestar», brillo alto, sin notificaciones en la barra.
- [ ] La campana sin avisos pendientes (o que no se vea el número).
- [ ] Nada de «Mis ingresos» por debajo de las cuatro cifras: ahí salen
      porcentajes.

**Cómo grabar y montar:** paso a paso en [`grabar-y-montar.md`](grabar-y-montar.md).
Aquí, solo lo propio de este reel.

## Escenas

| #   | Seg.  | Qué se ve                                                                                                                     | Texto en pantalla (y voz)                                                                                |
| --- | ----- | ----------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| 1   | 0–3   | Portada de la web, bajando despacio hasta las tarjetas de partida.                                                            | **Dirige tu primera mesa en TuGameMaster**                                                               |
| 2   | 3–6   | Tarjeta de texto sobre fondo oscuro.                                                                                          | **3 pasos.** Y nada se publica hasta que tú quieras.                                                     |
| 3   | 6–14  | `/cuenta/gm`: titular, «Cómo diriges» y las casillas de idioma (marcar una). Acelerado.                                       | **1 · Tu perfil de game master** — Cuenta cómo diriges: es lo que lee quien decide si se sienta contigo. |
| 4   | 14–17 | `/cuenta/cobros`, solo el recuadro de arriba y el botón «Empezar el alta» (o «Cuenta verificada»).                            | **2 · Dónde cobrar** — Lo gestiona Stripe, no nosotros.                                                  |
| 5   | 17–22 | **Tarjeta rehecha:** tres líneas con icono.                                                                                   | Stripe te pedirá: **tus datos**, **tu IBAN** y **una web**.                                              |
| 6   | 22–27 | **Tarjeta rehecha:** el campo «Tu sitio web» con `tugamemaster.com/gm/tu-nombre` escrito.                                     | En la web, **pon tu perfil de TuGameMaster**. Por eso el perfil va primero.                              |
| 7   | 27–36 | «Nueva partida»: las tres tarjetas (Fecha fija, Fecha flexible, Continuar campaña), tocar «Fecha fija» y rellenar. Acelerado. | **3 · Tu primera partida** — Fecha, plazas y precio.                                                     |
| 8   | 36–40 | Bajar hasta «Quién puede reservar» y marcar «Privada».                                                                        | ¿Es tu grupo de siempre? Hazla **privada**, con contraseña.                                              |
| 9   | 40–44 | La gestión de «La cripta bajo el molino»: «Borrador · Todavía no la ve nadie · Publicar».                                     | Nace como **borrador**. La publicas cuando esté lista.                                                   |
| 10  | 44–48 | Tarjeta de cierre con el emblema.                                                                                             | El jugador paga al reservar. **Tú cobras a partir de 48 h después de jugar.** Enlace en la bio.          |

**En la escena 7, no pulses «Crear borrador».** Corta antes y pasa a la
escena 9 con la partida que ya existe. Así no se crea otra partida igual.

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
| 5       | `escena-05-tarjeta.png` | Tarjeta (5 s)                 |
| 6       | `escena-06-tarjeta.png` | Tarjeta (5 s)                 |
| 7       | `escena-07-rotulo.png`  | Rótulo sobre la grabación     |
| 8       | `escena-08-rotulo.png`  | Rótulo sobre la grabación     |
| 9       | `escena-09-rotulo.png`  | Rótulo sobre la grabación     |
| 10      | `escena-10-tarjeta.png` | Tarjeta (4 s), con el emblema |

## Qué grabar, plano a plano

Seis clips grabados (escenas 1, 3, 4, 7, 8 y 9); el resto son tarjetas. Todo con
la sesión de Ulises en `tugamemaster.com`. **No grabes el menú de la cuenta**: en
tu sesión enseña «Administración». Por eso cada clip empieza con la página ya
abierta.

**Clip 1 — Portada de la web (queda en 3 s).**
Abre `tugamemaster.com` con la página ya cargada y arriba del todo. Espera 2 s.
Desplaza hacia abajo **muy despacio**, con un solo gesto largo, hasta que se vean
las primeras tarjetas de partida. Para y espera 2 s.
_Montaje:_ ×1,5 si hace falta; el rótulo 1 encima.

**Clip 3 — Perfil de game master (queda en 8 s).**
Antes de grabar, abre `tugamemaster.com/cuenta/gm` (o «Mi panel» › «Perfil de game master»). Empieza a grabar con la página ya cargada y espera 2 s arriba.
Desplaza hasta el **titular** y para 1 s; sigue hasta **«Cómo diriges»** y para 1 s;
sigue hasta los **idiomas** y **marca una casilla y desmárcala** (que vean que se
tocan). **No pulses «Guardar».**
_Montaje:_ ×2; el rótulo 3 encima. Si el titular y «Cómo diriges» se leen, mejor
que vaya más lento ahí y más rápido en los desplazamientos.

**Clip 4 — Cobros (queda en 3 s).**
Antes de grabar, abre `tugamemaster.com/cuenta/cobros` (en el menú se llama «Mis ingresos»). Que se vea **solo el recuadro de arriba** con el
estado («Cuenta verificada» en tu caso). **No bajes hasta «Mis ingresos»**: ahí
salen porcentajes y cifras. No toques nada.
_Montaje:_ ×1; el rótulo 4 encima. Si se ve algo de «Mis ingresos» en la parte
de abajo, amplía el clip hasta que quede fuera.

**Clip 7 — Nueva partida (queda en 9 s).**
Antes de grabar, abre «Mis partidas» y empieza a grabar ahí. Toca **«Nueva partida»**. Para 1 s en las **tres tarjetas**
(Fecha fija, Fecha flexible, Continuar campaña). Toca **«Fecha fija»**. Rellena
**título, sistema, fecha, plazas y precio** con lo de la partida 1 de
`datos-demo.md` (no hace falta rellenar todo: con esos cinco basta para que se
entienda). **Para la grabación sin pulsar «Crear borrador».**
_Montaje:_ ×3–×4 en lo escrito; el rótulo 7 encima.

**Clip 8 — Privada (queda en 4 s).**
En la misma página (puedes seguir del clip 7 sin salir), desplaza hasta **«Quién
puede reservar»**, para 1 s y toca **«Privada»**: aparece el campo de la
contraseña. Para 1 s. **No escribas una contraseña real tuya**; si escribes algo,
que sea una inventada para la toma. **No pulses «Crear borrador».**
_Montaje:_ ×1,5; el rótulo 8 encima.

**Clip 9 — La partida en borrador (queda en 4 s).**
Antes de grabar, abre **«La cripta bajo el molino»** desde «Mis partidas». Que se vea arriba la
lámina, el aviso de **borrador** («Todavía no la ve nadie») y el botón
**«Publicar»**. **No lo pulses.**
_Montaje:_ ×1; el rótulo 9 encima. Un zoom suave hacia «Publicar» queda bien aquí.

**Las tarjetas (escenas 2, 5, 6 y 10):** no se graban; se ponen como imagen con
la duración de la tabla de arriba.

**Duración total:** unos 45–48 s. Si pasa de 50, recorta el clip 3, que es el
más largo.

## Voz (opcional)

Si la pones, es este texto, dicho con naturalidad y sin añadir nada. Cada línea
es una escena:

> 1 · Así diriges tu primera mesa en TuGameMaster.
> 2 · Son tres pasos, y nada se publica hasta que tú quieras.
> 3 · Uno: tu perfil de game master. Cuenta cómo diriges: es lo que lee quien
> decide si se sienta contigo.
> 4 · Dos: dónde cobrar. Lo gestiona Stripe, no nosotros.
> 5 · Stripe te pedirá tus datos, tu IBAN y una web.
> 6 · En la web, pon tu perfil de TuGameMaster. Por eso el perfil va primero.
> 7 · Tres: tu primera partida. Fecha, plazas y precio.
> 8 · ¿Es tu grupo de siempre? Hazla privada, con contraseña.
> 9 · Nace como borrador, y la publicas cuando esté lista.
> 10 · El jugador paga al reservar, y tú cobras a partir de 48 horas después de
> jugar. El enlace, en la bio.

## Texto de la publicación

> ¿Diriges partidas de rol y quieres cobrar las plazas sin perseguir a nadie?
> En TuGameMaster son tres pasos:
>
> 1 · Tu perfil de game master: cómo diriges, en qué idiomas, qué sistemas.
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

**Texto alternativo:** «Vídeo tutorial de TuGameMaster: cómo crear el perfil de
game master, dar de alta los cobros con Stripe y crear la primera partida en
borrador.»

## En la web

El mismo vídeo, **sin música**, encabezando la guía del blog «Dirige tu
primera mesa». El blog admite clips `.mp4` de `public/blog/` (menos de 5 MB, 1280
px de ancho como mucho) o un enlace de YouTube (ver `docs/blog.md`). Para un
vídeo de 45 s, mejor **subirlo a YouTube como Short y enlazarlo**: un clip de
ese largo pasa de los 5 MB. Al tocar la guía, se cambia también la frase de las
48 horas (punto 7 de la auditoría).

## Comprobado contra la web

Cada frase del reel y del texto, y de dónde sale:

| Frase                                                       | Dónde se comprueba                                                        |
| ----------------------------------------------------------- | ------------------------------------------------------------------------- |
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
