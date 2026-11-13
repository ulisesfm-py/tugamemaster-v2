# La oferta de fundador

Qué se ofrece a los primeros game masters, qué se les pide, qué **no** se les
promete y qué pasa si dejan de serlo. Es la base de todos los mensajes: ningún
mensaje puede decir algo que este documento no diga.

Las reglas técnicas viven en `CLAUDE.md`, `docs/payments.md` y
`src/modules/invitaciones/politica.ts`. Si algo de aquí contradice al código,
manda el código y se corrige este documento.

> Estado: **cerrado con Ulises** (5 % para siempre, 0 % con código, 10
> fundadores, condición retirable solo por incumplir las normas de la web). Los
> puntos marcados con **[decidir]** o **[confirmar]** que queden siguen
> abiertos; hoy solo el fiscal y el tiempo de ayuda personal.

## En una frase

Los diez primeros game masters de la web pagan **un 5 %** por los jugadores que
les trae la web, **un 0 %** por los que traen ellos con su código, y lo
conservan para siempre. A cambio de probar con nosotros una web que todavía es
pequeña.

## Qué reciben

### Las condiciones económicas

| Jugador que reserva                                        | Comisión de TuGameMaster |
| ---------------------------------------------------------- | ------------------------ |
| Se registró con **el código del fundador**                 | **0 %**                  |
| Llegó por la web (cualquier otro jugador)                  | **5 %**                  |
| _(Para comparar: un game master estándar, cualquier caso)_ | _10 %_                   |

Cómo se aplica, tal como lo hace hoy el código:

- **El 0 % es de comisión nuestra, no de coste cero.** El coste de la pasarela
  de pago (Stripe) se descuenta siempre del pago al game master, sea cual sea
  la comisión. Es el coste real que Stripe reporta en cada cobro, no una
  estimación.
- **El emparejamiento se guarda en la cuenta del jugador al crearla.** Vale
  aunque el enlace se abra en el móvil y la cuenta se cree en el PC.
- **Una cuenta que ya existe no se empareja nunca.** Los jugadores que el
  game master ya tiene _fuera_ de la web tienen que crear una cuenta nueva con
  su código. Quien ya se había registrado por su cuenta no puede acogerse al 0
  % después: así nadie se ahorra la comisión pasándole el código a un jugador
  que trajo la web.
- **El código admite registros durante 3 meses** desde que se emite. Un
  administrador lo renueva o emite uno nuevo cuando haga falta (por ejemplo,
  cuando el game master quiera traer a otra tanda de jugadores).
- **Lo que caduca es el código, no el emparejamiento.** Un jugador que se
  registró con el código dentro de plazo sigue siendo suyo, con el 0 %, para
  siempre.
- **La comisión se congela en cada reserva** en el momento de reservar. Si
  algún día cambia cualquier porcentaje, las plazas ya vendidas conservan el
  que tenían.

Ejemplo, con una mesa de 5 plazas a 15 € (75 € en total) y tarjetas europeas
estándar. Son cifras aproximadas: la real la fija Stripe en cada cobro.

|                                  | Jugadores de la web (5 %) | Jugadores con su código (0 %) |
| -------------------------------- | ------------------------- | ----------------------------- |
| Cobrado a los jugadores          | 75,00 €                   | 75,00 €                       |
| Comisión de TuGameMaster         | 3,75 €                    | 0,00 €                        |
| Coste de Stripe (1,5 % + 0,25 €) | ≈ 2,40 €                  | ≈ 2,40 €                      |
| **Transferencia al game master** | **≈ 68,90 €**             | **≈ 72,60 €**                 |

La tarifa de Stripe (1,5 % + 0,25 € para tarjetas europeas estándar) está
confirmada por Ulises. Las tarjetas no europeas cuestan más, y también lo
asume el game master.

### Lo que no cambia respecto a cualquier game master

Es lo que hace útil la web y se puede contar sin exagerar, porque ya existe:

- **Cobro por adelantado**: el jugador paga al reservar, con tarjeta.
- **Cobro del game master 48 horas después de terminar la partida**, si no hay
  incidencias. En la práctica entre 48 y 72 horas, porque el job es diario.
- **Reputación verificada**: estrellas, reseñas y partidas dirigidas salen solo
  de mesas reservadas y pagadas aquí. Cuentan también jugadores distintos,
  cuántos repiten y partidas canceladas.
- **Devoluciones reguladas**: el jugador recupera el 90 % en saldo si cancela
  con más de 48 h; el 100 % si cancela el game master o una incidencia se
  aprueba. El game master no cobra de una partida con incidencia abierta.
- **Hilo de mesa** (asíncrono, no un chat en tiempo real) y **avisos** dentro
  de la web (la campanita). Sin correo por ahora.
- **Campañas**: la continuación de una partida ya jugada, reservada solo a
  quienes jugaron la anterior, con la nota de cómo acabó la sesión.
- **Partidas privadas** con contraseña, para el grupo de siempre.
- **Sus ingresos a la vista**: cobrado, en camino, retenido y por jugarse, con
  el desglose de cada plaza.
- **Sin cuota mensual ni permanencia**: un mes sin dirigir no cuesta nada.

### Lo que es solo de fundadores

- **Distintivo de fundador** en su avatar y en su nombre.
- **Su código y su enlace** (`/r/<código>`) en su panel (`/dashboard`) y, con el
  detalle de quién se ha registrado, en `/cuenta/cobros`, listos para copiar.
- **Trato directo con Ulises**: sus necesidades pesan en lo que se construye
  después. Es una promesa de atención, no de plazos.
- **Ayuda para publicar su primera partida** (de `plan.html`). **[decidir]**
  Cuánto tiempo se puede dar a cada uno si el plan sale bien: es la parte que
  más pesa en la agenda de una sola persona.

## Qué se les pide

Son **peticiones**, no condiciones: ninguna se paga con la comisión.

1. Crear su perfil de game master y dar de alta sus cobros en Stripe.
2. Publicar una primera partida (puede ser una de su grupo de siempre,
   privada).
3. Poner su enlace de fundador donde ya le encuentran sus jugadores (la bio de
   Instagram, el canal de Twitch, su Discord).
4. Contarme qué falla o qué falta, sin filtrar.

**No se les pide** exclusividad, un mínimo de partidas ni que dejen de usar lo
que ya usan. La web se suma a su Instagram, no lo sustituye.

## Cuántos y cómo se nombran

- **Diez.** Un administrador los nombra a mano desde `/admin/game-masters`;
  nadie puede pedirlo ni ganarlo por sí solo.
- Hay que haber creado antes la cuenta y el **perfil de game master**: hasta
  entonces no aparece en esa lista.
- Al nombrarle se le crea su código de invitación (o se renueva el que ya
  tuviera).
- **El 10 es un tope que debe cumplirse de verdad.** Si se amplía, se hace sin
  maquillaje y sin tocar las condiciones de los diez primeros.

## Durante cuánto tiempo

**Sin fecha de fin.** El 5 % y el 0 % son **permanentes**: no suben aunque
cambie la política general del resto de game masters. Lo único que puede
cambiar es el coste de Stripe, que es de Stripe y se descuenta siempre del
cobro. Esto es una promesa: conviene que figure por escrito en una página que
la web enseñe (ver «Texto para la web», más abajo) para que no dependa de un
mensaje de Instagram.

**Una sola excepción, y se dice sin rodeos:** la administración se reserva el
derecho a retirar la condición de fundador a quien incumpla las normas de
comportamiento de la web. No hace falta detallarlas en la oferta. **Ojo:** hoy
esas normas no están escritas en ninguna página (`/condiciones` solo trata de
cancelaciones y reclamaciones). Pasar mucho tiempo sin dirigir **no** es
motivo para perderla (sí puede caducar el código, que se renueva).

## Qué pasa cuando dejan de serlo

Un administrador puede quitar la condición (a petición suya o por incumplir
las normas de comportamiento de la web):

- **Las reservas ya hechas conservan su comisión**: lo vendido no cambia.
- **Las reservas nuevas pasan al 10 %**, incluidas las de sus jugadores con
  código: el 0 % es una ventaja del plan, no algo suyo aparte.
- **Su código deja de admitir registros**, aunque no haya caducado.
- Los jugadores emparejados siguen emparejados, pero eso ya no les da ninguna
  ventaja.
- Pierde el distintivo. No cambia lo que puede hacer en la web: es un plan, no
  un rol.

## Lo que NO se promete

Esta lista importa tanto como la de arriba. Todo lo siguiente es verdad hoy y
es lo que nos separa de una promesa vacía.

- **Ningún volumen de reservas.** La web es nueva: hoy hay un único game master
  y tres partidas de ejemplo. Los fundadores traen a sus propios jugadores; la
  web irá sumando los suyos a medida que haya partidas con plazas libres.
- **Ingresos concretos.** No se publican cifras de jugadores, de partidas ni
  de lo que se puede ganar. El ejemplo de la tabla es aritmética, no una
  previsión.
- **«Vivir de esto».** Es el sueño de fondo de la web, no una promesa a nadie.
- **Plazos de Stripe.** La verificación de su cuenta puede tardar días; la
  hace Stripe, no nosotros.
- **Cuestiones fiscales.** Quién factura qué, el IVA de la comisión y las
  obligaciones de cada game master como vendedor **no están cerradas**: ver
  «Antes de que cobre un fundador», más abajo. No se afirma nada sobre
  impuestos hasta cerrarlo.
- **Una portada rotatoria o un hueco destacado.** `plan.html` lo mencionaba y
  **no existe en la web**. No se ofrece.
- **Un chat en tiempo real, un buscador de jugadores o Discord automatizado.**
  Hay un hilo asíncrono por mesa. Las salas de Discord están en el backlog.
- **Recuperar dinero ya pagado a un game master.** Una incidencia abierta
  detiene el pago, pero si el pago ya salió, el caso se trata a mano.

## Antes de que cobre un fundador

Escribir el primer mensaje **no** exige que todo esto esté hecho. Que un
fundador dé de alta su cuenta y publique una partida **sí**.

**Antes de escribir el primer mensaje**

- [x] Las partidas de prueba, privadas (hecho por Ulises).
- [x] Esta oferta cerrada.
- [x] Un sitio donde el fundador pueda leer sus condiciones: `/fundadores`
      (hecho; falta desplegarlo, ver más abajo).

**Antes del alta de un fundador en Stripe**

- [ ] Los **dos webhooks de Stripe en modo real**. Sin el segundo, la cuenta del
      game master queda verificada en Stripe y la web no se entera sola.
- [ ] _(Opcional, cosmético.)_ El nombre del negocio en Stripe sale como «Tu GM»;
      cambiarlo a «TuGameMaster» en el panel deja todo más coherente, pero no
      bloquea nada.

**Antes de que cobre un solo euro**

- [ ] Prueba real de pago de 1 € con tarjeta propia.
- [ ] Vercel Pro (el plan gratuito no admite uso comercial).
- [ ] **El asesor fiscal**, para las dos cuestiones que `plan.html` marca como
      críticas: el IVA de una plataforma que cobra en su nombre y el
      informe DAC7 a Hacienda (que exige el NIF y el domicilio fiscal de cada
      game master). No se sabe aún si el alta actual de Stripe cubre lo que
      pide DAC7: **[confirmar]**.
- [ ] Resend con dominio verificado. Sin él, el game master no recibe ni el
      aviso de una reserva ni el de un pago. Hay que decírselo si todavía no
      está.

## Texto para la web (implementado en `/fundadores`)

Está hecho: la página `/fundadores` existe y `/para-game-masters` enlaza a ella.
Sus porcentajes salen del código (`payments/dinero.ts`), no de este texto. El
borrador original, por si hay que revisar algo:

> **Game masters fundadores.** Son los primeros diez game masters de
> TuGameMaster, nombrados a mano.
>
> - Pagan un **5 %** de comisión por los jugadores que llegan por la web y un
>   **0 %** por los que se registran con su código de invitación.
> - El coste de la plataforma de pago se descuenta siempre del cobro.
> - Estas condiciones son permanentes. La administración puede retirar la
>   condición de fundador a quien incumpla las normas de comportamiento de la
>   web.
> - Las reservas ya hechas conservan siempre la comisión con la que se
>   vendieron.
> - El código de invitación admite registros durante tres meses y se renueva
>   cuando hace falta. Los jugadores que ya se hayan registrado con él
>   conservan el 0 %.
> - Una cuenta que ya existía no se puede emparejar después.
>
> No prometemos un número de reservas.

## Lo que cuesta, para que no sorprenda

Dato para Ulises, no para los mensajes. Con 10 fundadores, 200 partidas al mes
de 5 plazas a 15 € (15.000 € cobrados) y **todo al 0 %**, los costes de Stripe
Connect que paga la plataforma son unos **60–76 € al mes**, y hasta ~112 € si
Stripe suma además la fila de «direccionamiento de fondos»: 2 € por cuenta
activa, un 0,25 % del dinero transferido y 0,10 € por transferencia. Es un
0,4–0,75 % del volumen. No hace falta una tarifa al jugador. Se revisa cuando
haya volumen real. El 0 % con jugadores emparejados es permanente: es ingreso
que no existirá.
