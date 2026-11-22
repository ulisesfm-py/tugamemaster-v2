# Auditoría de la web para los reels tutoriales (fase 1)

Recorrido de **producción** (https://tugamemaster.com) el 21/11/2026, con el
navegador integrado. Primero como visitante y después con la sesión de Ulises
(game master y admin), mirando sobre todo **a tamaño de móvil (375 px)**, que es
desde donde llega quien viene de Instagram. No se ha reservado, pagado, publicado
ni guardado nada, y no se ha entrado en `/admin`. Lo que dice la web se ha
contrastado con `CLAUDE.md` y, cuando hacía falta, con el código.

Para cada pantalla: **qué se entiende en 5 segundos**, **qué texto sobra**,
**qué confunde** y **qué falta**. Al principio, la lista de hallazgos ordenada
por importancia. Al final, lo que no se ha podido ver sin crear datos.

> Nada de esto se ha cambiado en la web. Cada propuesta se decide antes de tocar
> código.

---

## 1. Hallazgos, de más a menos importante

### Bloquean los reels (hay que resolverlos antes de grabar)

**1. El listado `/partidas` nunca enseña las mesas con fecha flexible.**
La portada muestra «El Faro de Finisterre» en «Partidas abiertas», pero al pulsar
«Ver todas» desaparece: el listado dice «2 mesas» y no aparece la sección «Con
fecha flexible». El código quiere enseñarla solo cuando no hay filtros, pero
calcula «hay filtros» contando las claves del objeto de filtros validado, y ese
objeto siempre lleva `soloLibres: false` y `ultimasPlazas: false`
(`src/app/(public)/partidas/page.tsx`, función `Mesas`, línea `const hayFiltro =
Object.keys(filtros).length > 0`). Así que nunca sale. Es un fallo y no una
decisión, y deja sin sentido el reel de «pre-reservar» («entra en Partidas y
busca…»).

> **Arreglado el 21/11/2026** (sin desplegar hasta el push): `hayFiltro()` en
> `src/modules/games/schema.ts` solo cuenta los filtros con valor, con test en
> `tests/unit/game-schema.test.ts`.

**2. No hay ninguna mesa que se pueda enseñar en un vídeo.** Todo lo publicado
es de prueba y se nota: «Partida de prueba», «Partida de prueba 2», «Esta es una
partida de PRUEBA para testear…», «Otra partida de prueba», una a las **00:00
del 31 de diciembre**, y la mesa flexible a **0,00 €/plaza**. El perfil público
del GM enseña en su historial «Partida test inicial», «Nueva partida de prueba» y
«Partida gratuita de prueba». La campaña y la mesa flexible se llaman igual
(«El faro de Finisterre» / «El Faro de Finisterre»), lo que en un tutorial de
campañas confunde.
_Propuesta:_ antes de grabar, preparar **una cuenta de GM de demostración** con
un perfil completo (foto, titular, «cómo dirige») y tres o cuatro mesas
creíbles: una con fecha fija y precio real, una privada, una flexible con
precio, y una campaña con su sesión 1 jugada. Y una **cuenta de jugador de
demostración** para grabar el lado del jugador. Esto exige crear datos en
producción: **lo decides tú** (ver «Lo que no he podido ver», al final).

**3. «Mis ingresos» enseña un error de Stripe en inglés y culpa al GM.**
En `/cuenta/cobros`, la partida «Partida test inicial» dice «Falló la
transferencia. Lo reintentamos solos. Si se repite, revisa tu cuenta de cobro.
Motivo: _Insufficient funds in Stripe account. You can use the /v1/balance
endpoint…_». El motivo real es que **la plataforma** no tenía saldo disponible,
no la cuenta del GM, y el texto se pinta tal cual llega de Stripe
(`blockedReason`, en `cobros/page.tsx`). El panel lo resume como «Tu pago de
Partida test inicial está retenido» en «Te toca hacer», cuando el GM no puede
hacer nada. Y la tarjeta de arriba lo cuenta como «Retenido: hay algo que
resolver».
_Propuesta:_ traducir los motivos conocidos («Esperando a que Stripe libere el
dinero de los cobros: lo reintentamos solos, no tienes que hacer nada») y no
enseñar nunca el texto en bruto de Stripe. Quitar de «Te toca hacer» lo que no
le toca hacer a él. Puede que el último commit («esperar a los fondos») ya
evite que esto se repita, pero **la fila antigua sigue saliendo así**.

**4. Las partidas sin precio se quedan «En camino» para siempre.**
«Nueva partida de prueba» y «Partida gratuita de prueba» (0,00 €) llevan días en
«En camino — La transferencia sale en la próxima ejecución del pago
automático». No va a salir nunca: el pago a GMs salta las partidas con total 0
sin dejar fila (`payouts.ts`, `if (total <= 0)`), y el libro deduce «En camino»
porque no hay fila. No mueve dinero, pero es una promesa falsa en la pantalla
que más confianza tiene que dar.
_Propuesta:_ un estado «Sin importe» (o no mostrar la fila de dinero) para las
partidas gratuitas.

**5. En «Mis ingresos» se ven porcentajes, y en el móvil la cifra que importa
se corta.**
Cada plaza enseña su comisión en porcentaje (en tu cuenta salen 10 %, 5 %, 0 %,
de antes del cambio de tarifas) y el pie de página dice «tu comisión es del 3 %
en lugar del 6 % general». **Un reel no puede grabar esta pantalla tal cual**:
daría cifras, que en redes no se dan. Además, en 375 px la tabla se sale por la
derecha y la columna «Para ti», que es lo que quiere ver el GM, queda fuera de
pantalla. Hay que deslizar la tabla para verla.
_Para el reel:_ grabar solo la cabecera (Cobrado / En camino / Retenido / Por
jugarse) con una cuenta de demostración, o rehacer la pantalla como tarjeta, que
es lo que ya se hizo en la publicación 2.
_Para la web:_ en el móvil, cada plaza como una ficha (jugador, pagó, para ti) y
el desglose debajo.

### Importantes (confunden o prometen de más)

**6. ~~«Te avisamos por correo»~~ — resuelto: Resend está activo** (confirmado
por Ulises el 21/11/2026), así que el correo de «ya hay fecha»
(`avisarMesaConvocada`) sale. Qué se avisa por correo y qué solo en la campana
está ahora en `docs/notificaciones.md`. **Antes de prometer un aviso en un
reel, mirar ahí**: por ejemplo, el GM no recibe nada cuando un jugador libera
su plaza, y no hay correo cuando Stripe verifica la cuenta.

**7. «48 horas después, el dinero está en tu cuenta»** (guía para GMs del blog,
recuadro «En 30 segundos»). Es más de lo que la web hace. Cómo va de verdad:

- El cron corre una vez al día (04:00 en Madrid) y paga las partidas que
  terminaron hace **más de 48 h**. Así que la transferencia sale **entre 48 y 72
  h** después del final.
- **Solo si Stripe ya ha liberado el dinero** de los cobros. Si no, espera al
  día siguiente: el punto 3 es justo eso. Con una reserva pagada poco antes de
  jugar, puede pasar de 72 h.
- La transferencia llega a la cuenta de **Stripe** del GM. De ahí al banco,
  «normalmente en un par de días hábiles», como dice el propio correo de pago
  enviado (`pagoEnviado`).

«Entre 48 y 72 horas» describe bien el caso normal, pero **no es una garantía**.
_Texto propuesto para la guía:_ «Y a partir de 48 horas después de terminar,
si no hay incidencias, te transferimos tu parte». **En los reels: «a partir de
48 horas»**, nunca «a las 48 h», «en 72 h como mucho» ni «en tu cuenta». La guía
publicada está en la base de datos y se cambia desde el editor del blog; su
copia es `docs/blog/guia-game-masters.md`.

**7 bis. No se puede recuperar la contraseña.** El login no tiene «¿Has
olvidado tu contraseña?» y no existe ese correo. Quien la olvide y no entre con
Discord se queda fuera, y la única salida es escribiros. En el reel de «crear
cuenta» conviene **recomendar Discord** o decir «apúntala»; para la web es un
hueco real que hay que cubrir antes de tener muchos usuarios.

**8. La cabecera no lleva a nada para game masters.** Arriba solo hay
Partidas, Game masters (que es el directorio) y Blog. «Cómo funciona», «Para
game masters» y «Fundadores» solo están en el pie. El GM que llega desde
Instagram no encuentra su página sin bajar hasta el final, y «Game masters»
parece que es para él, pero es la lista de GMs para jugadores.
_Para los reels:_ el enlace de la bio (o el que se diga en voz) tiene que ir
directo a `/para-game-masters` o a la guía del blog, nunca a la portada.
_Para la web:_ un enlace «Dirige» o «Para game masters» en la cabecera.

**9. El precio 0,00 € al lado de «Se paga al reservar».** En la mesa flexible
de prueba, el bloque dice «0,00 € por plaza · Se paga al reservar, cuando ya
haya fecha. Pre-reservar no tiene cargo». Leído deprisa, «0,00 €» parece «es
gratis», justo lo que `CLAUDE.md` quiere evitar con las pre-reservas. Se arregla
con la mesa de demostración (punto 2): en los reels, la mesa flexible tiene que
tener precio.

**10. El perfil público del GM: casilla vacía, cifras que se contradicen y
«cobradas» con partidas gratis.**

- La foto es un círculo vacío. Es lo primero que ve un jugador.
- «Partidas dirigidas: 3 — Jugadas y cobradas aquí», y una de las tres es
  «Partida gratuita de prueba». El código cuenta las partidas completadas con
  una reserva pagada, y una reserva de 0 € cuenta como pagada. «Cobradas» no es
  verdad para una gratuita. _Propuesta:_ «Jugadas aquí, con reserva», o contar
  solo las de pago.
- La campaña «El faro de Finisterre» dice «2 sesiones · 2 ya jugadas», pero
  esas sesiones no salen en «Partidas ya dirigidas» (nadie reservó). Para quien
  lo mira, la campaña y el historial no cuadran.
- Erratas: «1 han repetido» (debe ser «1 ha repetido»), «Terror-cósmico» con
  guion.

**11. La continuación de campaña deja continuar una sesión que no jugó nadie.**
En «Nueva partida → Continuar campaña» sale «El faro de Finisterre - Sesión 2 ·
0 jugadores · Crear la siguiente sesión». Como solo pueden reservar quienes
jugaron la anterior, esa sesión 3 nacería **sin nadie que pueda reservarla**. El
formulario no avisa. _Propuesta:_ no ofrecer las sesiones con 0 jugadores, o
avisar de que nadie podrá reservar. Errata en el formulario: «Solo podrán
reservar plaza 1 jugador» (debe ser «Solo podrá reservar plaza 1 jugador: quien
pagó y jugó…»).

**12. El perfil de GM pide los idiomas como «códigos de dos letras»** («es, en,
fr»). El formulario de partida, en cambio, usa casillas con los nombres
(Español, Català…). Un GM que no sea informático no sabe qué es «ca» o «eu».
_Propuesta:_ las mismas casillas que en la partida.

### Menores (pulido)

**13. Plazo de la mesa flexible dicho de dos formas.** El formulario dice
«tienen **unos días** para reservar y pagar»; la página pública y `CLAUDE.md`
dicen **48 horas**. _Propuesta:_ «48 horas» en los dos sitios.

**14. Una privada no explica al visitante qué necesita.** La ficha dice
«Privada» e «Inicia sesión para reservar», pero no que hará falta la contraseña
que reparte el GM. El jugador lo descubre al entrar. _Propuesta:_ una línea bajo
el precio («Para reservar necesitas la contraseña que da el game master»).

**15. «Inicia sesión para pre-reservar / para reservar»** en el botón principal.
Quien llega nuevo no tiene cuenta y el botón no le habla a él. _Propuesta:_
«Entra o crea tu cuenta para reservar».

**16. «Cómo funciona», paso 3 de la portada.** Se titula «Juega», pero el texto
habla de cuándo cobra el GM («El game master cobra 48 horas después…»). Para un
jugador no tiene sentido. _Propuesta:_ «Juega. Y si algo sale mal, tienes 48
horas para decirlo antes de que el game master cobre».

**17. El listado, en el móvil, ocupa la primera pantalla entera con filtros.**
En 375 px, el título, los atajos y el recuadro de filtros (buscar, sistema,
precio, con plazas, botón Filtrar) llenan la pantalla. La primera mesa empieza
por debajo. _Propuesta:_ filtros plegados tras un botón «Filtrar», con los
atajos visibles.

**18. Erratas sueltas.** Panel: «1 jugador ya se **han** registrado con él»;
mis partidas: «1 de 1 ocupada**s**»; login: «Bienvenido de vuelta» (mejor
«Hola de nuevo», que sirve para todos). En la cabecera del móvil solo sale el
emblema, sin el nombre.

**19. Las dos guías del blog ya son el guion de los reels.** «Reserva tu
primera mesa en 4 pasos» y «Dirige tu primera mesa» están bien escritas y
coinciden con la web, salvo el punto 7. Conviene que los reels sigan su orden y
sus palabras, y que cada reel enlace a la guía. La de GMs da cifras («el 6 % si
llegó por la web»): sirve en la web, pero **no se puede leer en voz ni enseñar
en un reel**.

---

## 2. Pantalla por pantalla

### Portada `/` (visitante)

- **En 5 segundos:** «Una silla libre en una buena mesa» + «Ver partidas
  abiertas». Se entiende que es para **jugar**. La ilustración ayuda. El GM no
  se siente aludido hasta el bloque «¿Diriges tú?», al final.
- **Sobra:** el bloque «Tu plaza está garantizada» repite lo que ya dice el
  hero («si el game master no aparece recuperas tu dinero») y el paso 2.
- **Confunde:** «recuperas tu dinero» en el hero, cuando lo que recupera es
  **saldo**, aunque más abajo se dice bien. El paso 3 (ver punto 16). Que las
  mesas de prueba estén ahí (punto 2).
- **Falta:** el paso del jugador desde que reserva hasta que se sienta: ¿por
  dónde se juega? «Quedadas en Discord» solo lo dice el perfil del GM.

### Listado `/partidas` (visitante)

- **En 5 segundos:** «Mesas abiertas» y unos atajos. En el móvil, el formulario
  de filtros tapa las mesas (punto 17).
- **Confunde:** «2 mesas», cuando la portada enseñaba 3 (punto 1).
- **Falta:** la sección de fecha flexible, que existe pero no sale.

### Ficha de partida `/partidas/<slug>` (visitante)

- **En 5 segundos:** precio, plazas libres, botón, y el recuadro «Reservar aquí
  te protege». Es la mejor pantalla de la web para un reel: **se entiende sin
  leer**.
- **Sobra:** nada importante. «La mesa, en corto» es largo, pero cada línea
  responde a una duda real.
- **Confunde:** privada sin explicar la contraseña (punto 14). «Si el game
  master no aparece, el 100 %» no dice que hay que abrir una incidencia y que la
  revisa una persona; la guía sí lo dice.
- **Falta:** dónde se juega (Discord, presencial…), si el GM no lo pone en la
  descripción.

### Mesa con fecha flexible `/mesas/<slug>` (visitante)

- **En 5 segundos:** «Fecha flexible», «0 de 3 para poder jugar» y un botón. Se
  entiende que es algo distinto, pero no **qué** hasta leer «Cómo funciona».
- **Sobra:** nada. Los tres pasos numerados son claros y caben en un reel tal
  cual.
- **Confunde:** el 0,00 € (punto 9) y «Te avisamos por correo» (punto 6).
  «Al llegar a 3, el game master fija la fecha» suena automático; en realidad
  **puede** fijarla.
- **Falta:** que cada persona puede pre-reservar en 5 mesas como mucho
  (`politica.ts`). Es una cifra de la web, no una comisión: se puede contar.

### Directorio `/gm` y perfil público `/gm/<slug>` (visitante)

- **En 5 segundos:** «Lo que certificamos», con cuatro cifras. Es el argumento
  de la reputación verificada y se ve bien.
- **Confunde:** ver punto 10.
- **Falta:** foto. Para el reel de «perfil de GM», un perfil de demostración
  completo.

### `/como-funciona`, `/para-game-masters` y `/fundadores` (visitante)

- **En 5 segundos:** son páginas de lectura, no de un vistazo. Están bien
  escritas y coinciden con `CLAUDE.md`.
- **Para los reels:** `/para-game-masters` y `/fundadores` dan porcentajes;
  sirven como destino del enlace, no como imagen del vídeo.
- **Detalle:** `/para-game-masters` dice «la comisión se congela en cada reserva
  **en el momento del cobro**»; `CLAUDE.md` dice que se decide **al reservar**.
  Para el GM da igual, pero mejor que coincidan («en el momento de la reserva»).
  `/fundadores` dice que la comisión «se calcula sobre lo que cobra el game
  master», que se puede leer como «sobre lo que me llega». Es sobre lo que pagan
  los jugadores.

### Registro y entrada `/registro`, `/login`

- **En 5 segundos:** claros, cortos y con Discord. «Código de tu game master
  (opcional)» se explica solo.
- **Falta:** nada para un reel. «Al menos 10 caracteres» en la contraseña es
  más de lo que espera la gente; conviene decirlo en el vídeo para que no se
  atasquen.

### Panel `/dashboard` (con sesión de GM)

- **En 5 segundos:** «Te toca hacer», saldo, ingresos y el enlace de invitación
  con «Copiar enlace». Para un GM, el enlace a la vista es un acierto.
- **Confunde:** «Te toca hacer» con algo que no le toca (punto 3). El panel
  mezcla lo de jugador (saldo, próximas mesas) con lo de GM; con una cuenta que
  es las dos cosas se entiende, pero en un reel de GM hay que recortar.
- **Sobra:** «Accesos» repite enlaces que ya están en las tarjetas y en el menú.

### Perfil `/cuenta` y perfil de GM `/cuenta/gm`

- **En 5 segundos:** formularios claros, con el «para qué sirve» de cada campo.
  «Lo que cuentas tú: esto no lo comprobamos» separa bien lo declarado de lo
  certificado.
- **Confunde:** idiomas en códigos (punto 12).
- **Falta:** una vista previa de cómo queda. Está el enlace «Ver mi perfil de
  game master», que en el reel basta.

### Ingresos `/cuenta/cobros`

- Ver puntos 3, 4 y 5. Es la pantalla con más valor para un GM y la que peor
  está hoy para enseñarla.
- **Lo bueno:** «Cuenta verificada», las cuatro cifras de arriba y la frase
  «Tus jugadores han pagado 1,00 €. De ahí salen…», que explica el dinero sin
  tabla.

### Mis partidas `/cuenta/partidas` y gestión de una partida

- **En 5 segundos:** «Abiertas / Con fecha flexible / Ya jugadas», cada una con
  su estado. Muy claro.
- **Gestión de una partida:** la contraseña de la privada con «Copiar
  contraseña», el hilo y los jugadores, arriba, y la edición debajo. Bien
  ordenado. «Retirar del portal» y «Cancelar partida» están separados y explican
  qué pasa.
- **Partida jugada:** «Cómo acabó la sesión» y «¿Seguís la historia otro día?»
  explican la campaña mejor que cualquier texto de ayuda. Es el mejor material
  para el reel de campañas.

### Nueva partida `/cuenta/partidas/nueva`

- **En 5 segundos:** tres tarjetas, Fecha fija / Fecha flexible / Continuar
  campaña, con una frase cada una. **Perfecto para un reel**: es literalmente el
  índice de los tres tutoriales de «crear partida».
- **Sobra:** el formulario mide 3.300 px en el móvil. Las frases de ayuda
  («Nadie reserva una mesa si no sabe si va a encajar en ella») son buenas, pero
  hay muchas. Para el reel, grabar por bloques (La partida / Para quién es /
  Cuándo y cuánto / Quién puede reservar), como la guía.
- **Confunde:** «unos días» frente a «48 horas» (punto 13), y la continuación de
  una sesión vacía (punto 11).

### Mesa flexible, vista del GM `/cuenta/partidas/flexibles/<id>`

- **En 5 segundos:** «Recogiendo pre-reservas · Faltan 3». Claro.
- **Bien:** «Comparte la mesa con tu gente para llegar antes».
- **Falta:** un botón para copiar el enlace de la mesa, ya que se le pide que la
  comparta.

### Hilo de mesa `/partidas/<slug>/hilo`

- **En 5 segundos:** se entiende que es un tablón de mensajes. «Cómo funciona
  este hilo» lo explica bien: quién entra, cuándo se cierra, que los avisos van
  a la campana y que se puede denunciar un mensaje.
- **Para el reel:** grabarlo con mensajes de las cuentas de demostración; el
  hilo real tiene mensajes de otras personas.

### Saldo `/cuenta/saldo` y Mis reservas `/mis-reservas`

- **Saldo:** el texto es claro y honesto («no vuelve a la tarjeta… escríbenos y
  lo revisamos»). En un reel, mejor con un movimiento de ejemplo que a 0,00 €.
- **Mis reservas:** vacía en tu cuenta; no he podido ver una reserva, ni el
  botón de liberar plaza, ni el de incidencia, ni el de reseña (ver abajo).

---

## 3. Lo que no he podido ver (exige crear datos)

Estas pantallas solo aparecen con una reserva, una pre-reserva o una cuenta
nueva. **No he creado nada**: lo decides tú. Lo más limpio es una **cuenta de
jugador de demostración** (la creas tú) y, si quieres que el GM de los vídeos no
seas tú, **una de GM de demostración**.

| Pantalla                                     | Para qué reel           | Qué hace falta                                        |
| -------------------------------------------- | ----------------------- | ----------------------------------------------------- |
| Registro con código `/r/<código>`            | Crear cuenta            | Una cuenta nueva (empareja para siempre: ojo)         |
| Alta de cobros en Stripe (desde cero)        | Alta de cobros          | **Vista el 22/11** hasta «Revisar y enviar» (§ 6)     |
| Reservar: contraseña de privada, Stripe, 3DS | Reservar                | Jugador de demo y una reserva real (o una mesa a 0 €) |
| Pre-reservar y la sección «Pre-reservas»     | Pre-reservar            | Jugador de demo y una mesa flexible                   |
| Mis reservas con plaza, liberar plaza        | Mis reservas / cancelar | Una reserva del jugador de demo                       |
| Abrir una incidencia                         | Cancelaciones           | Una partida jugada (y no enviarla)                    |
| Dejar una reseña                             | Reseñas                 | Una partida jugada con reserva pagada                 |
| Fijar la fecha de una flexible y las 48 h    | Fecha flexible          | 3 pre-reservas                                        |
| La campana de avisos                         | Varios                  | Abrirla podría marcar avisos como leídos; no la toqué |

Ojo con el registro con código: **una cuenta que se crea con el código de un GM
queda emparejada para siempre**. Si la cuenta de demostración se crea con tu
código, todas sus reservas contigo van al 0 %; no pasa nada si es de prueba,
pero conviene saberlo.

---

## 4. Reglas para escribir los guiones (salen de esta auditoría)

- **Ningún porcentaje**, ni en voz ni en pantalla. Pantallas que los enseñan:
  `/cuenta/cobros` (columna «Comisión» y pie), `/para-game-masters`,
  `/fundadores`, portada (bloque «¿Diriges tú?») y la guía de GMs del blog.
  Sí se puede decir: «sin comisión con tus jugadores» y «el coste de la pasarela
  se descuenta del cobro».
- **El dinero devuelto es saldo**, no «tu dinero» ni «a tu tarjeta». Cancelar a
  tiempo devuelve **el 90 % en saldo**; si cancela el GM, el 100 %; si no
  aparece, el 100 % **si un admin aprueba la incidencia**. (Estos porcentajes
  son de devolución, no de comisión: se pueden dar, y la web los da.)
- **El GM cobra «a partir de 48 horas»** después de terminar, si no hay
  incidencias. Nunca «a las 48 h» ni «en tu cuenta».
- **Pre-reservar no tiene cargo**; nunca «gratis».
- **Antes de prometer un aviso, mirar `docs/notificaciones.md`**: qué va por
  correo, qué solo a la campana y qué no se avisa.
- **El hilo no es un chat** ni manda correos: los avisos van a la campana.
- Nada de capturas con datos de otras personas (hilos, jugadores, ingresos
  reales): todo con cuentas de demostración.

## 5. Orden propuesto para arreglar antes de grabar

1. Punto 1 (flexibles en el listado): fallo de código, pequeño.
2. Punto 2 (datos de demostración): decisión tuya, sin código.
3. Puntos 3 y 4 (textos de «Mis ingresos»): pequeños, sin tocar el dinero.
4. Punto 6 (Resend): una comprobación en Vercel.
5. Punto 7 (guía del blog): una frase.

El resto se puede hacer después de los primeros reels sin que ninguno mienta.

---

## 6. Segunda vuelta: de cuenta nueva a game master (22/11/2026)

Con una cuenta creada para la ocasión («Decano de Springfield»): registro,
entrada, panel de jugador, perfil de GM y alta en Stripe hasta «Revisar y
enviar», **sin enviarla**. Ulises la dejó a medias a propósito para no tener
otra cuenta de Stripe a su nombre. Las pantallas de Stripe salen de sus
capturas. La cuenta a medias **no aparece en `/gm`**: un GM sin cobros no sale en
el directorio público.

> La cuenta se creó por error en el servidor local (`localhost:3000`), que usa
> la base de producción y claves de Stripe **de prueba**. Desde ahí se siguió en
> tugamemaster.com. **Nunca hacer el alta de cobros desde local**: guardaría en
> un usuario de producción una cuenta de Stripe de prueba.

**El hilo del reel: 1 Perfil · 2 Cobros · 3 Primera partida** (acordado con
Ulises).

### Hallazgos, de más a menos importante

**A. Al volver de Stripe sin terminar, la web dice dos cosas a la vez.** Arriba,
«Alta empezada, sin terminar». Justo debajo, «Stripe todavía está revisando tus
datos. Puede tardar un rato… Pulsa «Comprobar estado» más tarde». El segundo
mensaje sale siempre que la dirección lleva `?vuelta=1`
(`cuenta/cobros/page.tsx`), haya terminado el formulario o no. Quien lo ha
dejado a medias lee que Stripe lo está revisando y espera, y no vuelve nunca.
_Propuesta:_ enseñar «revisando» solo si Stripe ya tiene los datos enviados
(`details_submitted`), y si no, «Te faltan datos en Stripe: Continuar con el
alta».

**B. Stripe pregunta por «Datos de la empresa» y por una web, y la salida
fácil es incorrecta.** Pide «Tu sitio web» o, si no hay, una «descripción del
producto». La descripción va con una advertencia: al elegirla, confirmas que
**no** usas web, app, redes sociales ni perfil en línea para vender. Un GM que
vende en TuGameMaster, y seguramente en Instagram, sí los usa. Con la
descripción estaría afirmando algo falso. Y «empresa» asusta a quien no es
autónomo.
_Para el reel:_ «Aunque ponga empresa, es tu actividad como game master. En la
web, pon la dirección de tu perfil de game master en TuGameMaster». Por eso el
perfil va antes que los cobros.
_Para la web:_ al crear la cuenta de Stripe (`connect.ts`), mandar ya
`business_profile.url` con la dirección de su perfil público
(`/gm/<slug>`), y con eso Stripe no lo pregunta. También se le puede pasar la
descripción y el sector. Es un cambio pequeño en la zona de pagos: se explica
antes de tocarlo.

**C. Stripe vuelve a pedir el correo y luego un código por SMS.** La web ya le
pasa el correo, pero Stripe lo pide para crear el acceso del GM a su panel de
Stripe. Después manda un SMS; si no llega, hay «Crea tu cuenta de otra
manera» → código por correo. _Para el reel:_ «Usa el mismo correo; te llegará
un código al móvil (o al correo)».

**D. La marca de TuGameMaster en Stripe está sin poner.** Arriba sale
«TuGameMaster» con un **icono genérico verde**, no la llama, y el botón es el
morado de Stripe. En un reel se nota el salto. _Propuesta:_ en el panel de
Stripe, Ajustes → Marca (o la de Connect), subir el emblema y poner el naranja
`#e2622a`. Sin código.

**E. El texto del mandato SEPA puede asustar.** Al dar el IBAN, Stripe hace
aceptar que puede «enviar fondos desde y hacia esta cuenta» por adeudo SEPA.
Es el texto estándar de Stripe, pero un GM lee que le pueden cobrar. _Para el
reel o la guía:_ una línea que lo explique, sin prometer nada que no podamos
cumplir. **[confirmar]** en qué casos haría Stripe un adeudo a un GM (saldo
negativo de su cuenta, p. ej.) antes de escribir la frase.

**F. Al guardar el perfil de GM, el siguiente paso queda escondido.** Te quedas
en el mismo formulario, el «Guardado.» sale abajo, y «Configurar cobros»
aparece arriba como botón secundario (con borde y sin color). Es lo único que
hay que hacer en ese momento. _Propuesta:_ al guardar el primer perfil, llevar
a cobros, o al menos poner «Configurar cobros» como botón principal.

**G. «Configurar cobros» lleva a «Mis ingresos».** El alta vive dentro de la
página de ingresos, con las cuatro cifras a 0,00 €, el enlace de invitación y
una explicación con porcentajes. En el momento del alta sobra todo lo que hay
debajo del botón. _Propuesta:_ mientras no haya cuenta verificada, enseñar solo
el alta (y quizá el enlace de invitación).

**H. El perfil de GM no tiene foto.** Se sube en «Mi perfil» (`/cuenta`), en otra
pantalla. Quien solo rellena «Empezar a dirigir» se queda con el círculo vacío.
_Propuesta:_ la foto también aquí, o un enlace «Añade una foto».

**I. Idiomas en códigos de dos letras** (ya en el punto 12). Ulises lo confirma:
el catalán se abrevia «cat», no «ca». Casillas con el nombre, como en el
formulario de partida.

**J. «Cómo diriges» sin ejemplo.** Es lo que más lee el jugador. _Propuesta:_
un ejemplo con dónde se juega (Discord, Roll20, en persona), cuánto dura una
sesión y qué hay que traer.

**K. El panel del jugador nuevo empieza por «Mi saldo 0,00 €».** Sin «primeros
pasos». Lo útil para alguien que acaba de llegar es «Busca tu primera mesa» (que
está, pero debajo) y, si quiere dirigir, «Empezar a dirigir».

**L. Registro: mostrar la contraseña.** Ulises está de acuerdo en añadir el
botón para ver la contraseña. El ejemplo del código (`K7M2-QX9A`) **se queda**.

**M. El nombre es público y forma la dirección del perfil**
(`/u/decano-de-springfield`). El registro no lo dice. Ulises lo da por bueno tal
como está.

### Paso 3: la primera partida (con la cuenta de Ulises)

Se creó «La cripta bajo el molino» en **borrador**, privada, con los datos de
`datos-demo.md`. Sin publicar.

**N. El borrador no enlaza a su vista previa.** La gestión dice «Repásala
entera y publícala cuando esté lista», pero el único enlace de la página es
«← Mis partidas». La vista previa existe: `/partidas/<slug>` le enseña al GM su
borrador con el aviso «Esto es un borrador. Solo tú puedes verlo» (y a los
demás les da 404). Solo que no hay forma de llegar a ella. Con la partida ya
publicada sí sale «Verla como la ven los jugadores». _Propuesta:_ ese mismo
enlace también en borrador. Es lo que convierte «repásala» en algo que se puede
hacer.

**O. La lámina por defecto es un rectángulo con «D&D 5e».** La propia web lo
dice («Cumple, pero no llama»). En el listado, al lado de las partidas con
ilustración, se ve vacía. _Para el reel:_ subir lámina antes de grabar, y que el
reel de crear partida enseñe ese paso.

**P. La gestión mide 4.500 px en el móvil.** Arriba están el estado y
«Publicar», la contraseña, los jugadores y la lámina, y debajo el formulario de
edición completo, siempre abierto. Para el reel se graba solo la parte de
arriba. _Para la web:_ el formulario plegado tras «Editar».

**Q. Un borrador solo se puede «Cancelar partida», «para siempre».** Para una
mesa que nunca se publicó, «cancelar» suena a algo grave. No le cuesta nada al
GM (las canceladas sin gente no cuentan en su perfil), pero el texto no lo
dice. _Propuesta:_ en borrador, «Descartar borrador», con la aclaración de que
no deja rastro.

**R. Publicar sin cobros verificados da un mensaje de desarrollo.** Un GM
puede crear borradores sin haber terminado Stripe, pero al pulsar «Publicar»
lee: «Configura primero la cuenta donde quieres recibir los pagos. Ese paso
llegara con la integracion de cobros.» La segunda frase es de cuando no había
cobros, y va sin tildes (`games/service.ts`, `publicarPartida`). _Propuesta:_
«Antes de publicar, termina el alta de cobros» con un enlace a
`/cuenta/cobros`. Una línea.

**Lo bueno:** al crear, la web lleva directo a la gestión, con «Borrador ·
Todavía no la ve nadie · Publicar» arriba del todo; la contraseña de la privada
se ve y se copia con un botón; y «Nadie puede reservar mientras siga en
borrador» quita cualquier miedo. Es la pantalla del final del reel «1 Perfil ·
2 Cobros · 3 Primera partida».

### Lo que funciona y sirve para el reel

- El registro: cuatro campos, el código opcional y Discord. Lleva directo al
  panel.
- «Esto no basta para publicar», en «Empezar a dirigir»: es justo la frase que
  necesita un GM nuevo.
- «Aún no puedes cobrar… TuGameMaster no llega a ver tus datos».
- La campana avisa «Configura tu cuenta de cobro para poder publicar» en
  cuanto hay perfil de GM.
- Stripe en español, con el país ya puesto, y acepta un IBAN de Revolut.
