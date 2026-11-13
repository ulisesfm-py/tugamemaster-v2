# El alta de un fundador, paso a paso

Dos partes. La primera es **para enviar** al game master cuando ha dicho que sí:
corta, en tú, con los enlaces reales. La segunda es **para Ulises**: el orden en
que hay que hacer las cosas, por qué ese orden y qué mirar en cada paso.

Los textos de la primera parte describen lo que la web hace hoy. Si cambia una
pantalla, se cambia el texto. Las cifras salen de `oferta-fundador.md`.

---

## Parte 1 · Para enviar al game master

Se manda **solo cuando ya ha dicho que sí**, no antes. Va por el mismo canal en
el que hablasteis (si fue Instagram, por Instagram; el enlace se pega sin más).
Si se hace largo para un DM, lo divides en dos mensajes: «pasos 1 a 3» y, cuando
termine, «pasos 4 y 5».

> ¡Genial! Esto es lo que toca, son unos 15 minutos y lo haces una sola vez.
>
> **1. Crea tu cuenta.** En tugamemaster.com/registro, con correo y contraseña o
> con Discord.
>
> **2. Crea tu perfil de game master.** En tugamemaster.com/cuenta/gm. Cuenta
> cómo diriges, desde cuándo y qué sistemas. Es lo que verán los jugadores.
>
> **3. Da de alta tus cobros.** En tugamemaster.com/cuenta/cobros pulsa
> «Empezar el alta». Te lleva a Stripe, que es quien gestiona los pagos: te
> pedirá tus datos y una cuenta bancaria donde ingresar. Nosotros no vemos esos
> datos. Stripe puede tardar un rato en verificarte, a veces algún día. Cuando
> vuelvas, si sigue en revisión, pulsa «Comprobar estado» más tarde.
>
> **Avísame cuando hayas terminado el paso 3.** Es el momento de nombrarte
> fundador, y prefiero hacerlo yo antes de que publiques nada: la comisión de
> cada plaza se fija en el instante en que alguien reserva, y quiero que tus
> primeras reservas ya cuenten con tus condiciones.
>
> **4. Tu código.** Cuando te nombre fundador verás en tugamemaster.com/cuenta/cobros
> («Mis ingresos») tu código y tu enlace, con botón para copiarlos. El enlace es
> el que conviene poner en tu bio de Instagram o en tu canal.
>
> **5. Publica tu primera partida.** En tugamemaster.com/cuenta/partidas, «Nueva
> partida». Nace como borrador y la revisas entera antes de publicarla. Puede
> ser una mesa de tu grupo de siempre: si la marcas como privada, sale en el
> listado con la etiqueta «Privada» y solo reserva quien tenga la contraseña que
> tú reparta.
>
> Una cosa importante sobre tus jugadores de siempre: para que cuenten con tu 0 %
> tienen que **crear su cuenta con tu enlace o tu código**. Si alguien ya tiene
> cuenta en TuGameMaster, ya no se puede emparejar; pero seguirá pudiendo
> reservar en tus mesas con normalidad y el precio para ellos es el mismo.
>
> Si algo se atasca en cualquier paso, dímelo con una captura y lo miro. Esto
> está recién nacido y lo que falle me interesa saberlo.

### Texto para que el fundador lo mande a sus jugadores

Es lo que más ayuda a que sus jugadores de siempre se registren con el código.
Se lo das, ya escrito, cuando tenga su enlace:

> Voy a empezar a llevar mis mesas a TuGameMaster: pagas la plaza con tarjeta al
> reservar, recuperas tu dinero (en saldo) si cancelo yo, y se acabaron los Bizums sueltos y los
> plantones de última hora. Para reservar, crea tu cuenta con este enlace: [su
> enlace]. Es importante que sea con el enlace (o con mi código: [su código])
> porque así quedas como jugador mío. El precio de la plaza es el mismo que
> siempre.

**Una frase menos de la que parece**: no prometas «sin comisiones» a los
jugadores. La comisión la paga el game master, no ellos; si el jugador lee
«gratis» pensará que no paga nada. Lo que cambia para él es el método de pago y
las garantías, no el precio.

---

## Parte 2 · Para Ulises

### El orden, y por qué

| #   | Paso                       | Quién | Por qué en este orden                                                         |
| --- | -------------------------- | ----- | ----------------------------------------------------------------------------- |
| 1   | Cuenta                     | GM    | Sin cuenta no hay perfil.                                                     |
| 2   | Perfil de game master      | GM    | Hasta que existe, **no aparece** en `/admin/game-masters`.                    |
| 3   | Alta de cobros en Stripe   | GM    | Es lo que más tarda y lo único que no controlas.                              |
| 4   | **Nombrarle fundador**     | Tú    | Después del 3, para no gastar los 3 meses del código; antes del 5, ver abajo. |
| 5   | Su código y su enlace      | Web   | Se crean solos al nombrarle; los ve en `/cuenta/cobros`.                      |
| 6   | Primera partida, publicada | GM    | Solo puede publicar con cobros verificados.                                   |

Dos razones para el orden del 4:

- **La comisión se congela al reservar.** Si una partida se publica antes de
  nombrarle y alguien reserva, esa plaza se vende al **10 %**, y no se puede
  cambiar luego. Nombrarle antes de que publique lo evita. Un borrador sí puede
  existir antes sin problema.
- **El código dura 3 meses desde que se emite**, y se emite al nombrarle. Si se
  le nombra el día 1 y tarda 6 semanas en tener Stripe, ha gastado la mitad.
  Renovarlo es un clic (`Renovar 3 meses`), pero mejor no gastarlo.

### Qué hacer tú en cada paso

**Cuando responde «sí»**

- Pásale la Parte 1. Anota el estado `se da de alta` en el registro de contactos.
- No le pidas nada más. Lo de «a cambio, ponme tu enlace en la bio» llega
  después, cuando ya lo tenga.

**Mientras hace el alta en Stripe**

- Si pasan más de tres días sin noticia, un recordatorio amable y ya. No le
  presiones: la verificación es de Stripe.
- Si dice «Stripe me pide algo raro», pídele una captura. Si es un documento o
  datos fiscales, es Stripe quien decide qué hace falta; tú no los ves.

**Cuando te avisa de que ha terminado**

1. Entra en `/admin/game-masters`. Debe aparecer con **«Cobros listos»**. Si
   aparece «Alta de cobros sin terminar», todavía no: que pulse «Comprobar
   estado» en su pantalla, o espera al webhook.
2. Pulsa **«Hacer fundador»**. Comprueba que le sale el distintivo y que, en su
   fila, aparece su código con «Vale hasta…».
3. Avísale por el mismo canal: «Ya eres fundador. Tu código y tu enlace están en
   tugamemaster.com/cuenta/cobros. Ya puedes publicar.» **Hoy la web no le avisa
   sola**: no hay correo ni aviso al nombrarle. Ver `mejoras-web.md`.
4. Hazlo con la cuenta de administrador y **no hay confirmación**: el botón
   actúa al primer clic, y «Código nuevo» invalida el anterior (rompe el enlace
   de su bio). Úsalo solo si lo necesita de verdad.

**Cuando publica su primera partida**

- Mírala tú en la web, como jugador, antes de dar nada por hecho: título,
  descripción, precio, plazas, etiqueta de privada si toca.
- Si es privada, que **no te mande la contraseña por el mismo canal público**:
  que la reparta él a su grupo.
- Su primer cobro real es el momento de las comprobaciones de «Antes de que
  cobre un solo euro» (`oferta-fundador.md`). **No le dejes publicar para
  jugadores reales** hasta tenerlas.

### Los atascos más probables

| Qué pasa                                                 | Qué es                                                                | Qué haces                                                                                                                                                      |
| -------------------------------------------------------- | --------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| No aparece en `/admin/game-masters`                      | No ha creado el perfil (paso 2).                                      | Dile que entre en `/cuenta/gm` y guarde el perfil.                                                                                                             |
| Aparece «Alta de cobros sin terminar»                    | Stripe sigue verificando, o dejó el formulario a medias.              | Que pulse «Continuar con el alta» o «Comprobar estado».                                                                                                        |
| «Aún no puedo publicar» tras terminar con Stripe         | El webhook de la cuenta no llegó (o no está activo en modo real).     | Mira si «Comprobar estado» lo arregla. Si no, **es un problema tuyo**: revisa los webhooks de Stripe.                                                          |
| Abre su propio enlace `/r/…` y ve «Ya tienes una cuenta» | Es lo correcto: el código solo vale al crear una cuenta nueva.        | Que pruebe en una ventana privada, y sin iniciar sesión.                                                                                                       |
| Un jugador suyo se registró **sin** el código            | La cuenta ya existe: no se puede emparejar nunca. Es una regla firme. | No lo arregles a mano en la base. Dile que el jugador puede reservar igual y que esa plaza llevará el 5 % de comisión (la paga el game master, no el jugador). |
| El enlace de su bio ya no funciona                       | Se le emitió un «Código nuevo».                                       | Dale el enlace nuevo. Evita emitir códigos nuevos si no hace falta: usa «Renovar 3 meses».                                                                     |
| Su código ha caducado                                    | Pasaron 3 meses desde que se emitió.                                  | «Renovar 3 meses». Los jugadores ya registrados siguen siendo suyos.                                                                                           |

### Lo que no hay que hacer

- No nombrar fundador a alguien que **no ha hecho el alta de cobros**: gasta el
  código y no puede publicar.
- No nombrar a un undécimo. **La web no impone el tope de 10**: lo cuenta en la
  cabecera de `/admin/game-masters` y nada más.
- No quitar la condición a nadie sin haberlo hablado antes con esa persona. La
  web no pide un motivo ni lo guarda: **apúntalo tú** en el registro de
  contactos (fecha y razón en una línea). Está pensado para incumplimientos de
  las normas de comportamiento, no para penalizar la inactividad.
- No tocar la base de datos de producción a mano para arreglar un caso. Es la de
  verdad y `.env.local` apunta a ella.
