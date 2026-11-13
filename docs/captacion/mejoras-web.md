# Fricciones del alta de un fundador y mejoras propuestas

Recorrí el camino de un fundador tal como lo hace la web hoy (registro → perfil
→ cobros → nombramiento → código → primera partida) y lo que ve su jugador con
el enlace. Esto es lo que encontré y lo que propongo.

**Nada de esto está implementado.** Según `CLAUDE.md`, cada punto se aprueba
antes de tocar código. No añade dependencias ni servicios nuevos en ninguno de
los casos.

Cada punto lleva: **qué pasa hoy**, dónde lo vi, **la propuesta**, su tamaño y
**cuándo hace falta**.

## Resumen y recomendación

| #   | Mejora                                                  | Tamaño   | Cuándo hace falta                                |
| --- | ------------------------------------------------------- | -------- | ------------------------------------------------ |
| 1   | Página `/fundadores` con las condiciones                | Pequeño  | **Antes del primer mensaje**                     |
| 2   | Párrafo en `/privacidad` sobre contactos de captación   | Mínimo   | **Antes del primer mensaje**                     |
| 3   | Aviso al fundador cuando se le nombra                   | Pequeño  | Antes del 3.er fundador (los 2 primeros, a mano) |
| 4   | Tarjeta del código de fundador en el panel              | Mínimo   | Antes del primer fundador                        |
| 5   | Contador «n/10» y confirmación en `/admin/game-masters` | Mínimo   | Antes del 5.º fundador                           |
| 6   | Aviso al GM cuando Stripe lo verifica                   | Pequeño  | Opcional                                         |
| 7   | Alta de Stripe: tipo de cuenta y nombre del negocio     | Variable | Antes del primer fundador en Stripe              |
| 8   | Registro de quién y por qué deja de ser fundador        | Pequeño  | Opcional, cuando haya un caso                    |

**Recomiendo hacer 1, 2 y 4 ahora** (son lo que el fundador y tú vais a tocar
desde el primer día y cuestan poco) **y dejar 3, 5, 6 y 8 para cuando haya dos o
tres fundadores reales**: con diez personas máximo, avisar a mano y mirar un
número es razonable, y no merece la pena construir antes de saber qué se atasca
de verdad. El 7 no es código: es una decisión que hay que tomar antes del primer
alta.

---

## 1. Una página con las condiciones del fundador

**Qué pasa hoy.** `/para-game-masters` y la sección «¿Diriges tú?» de la portada
solo hablan del **10 %**. Un game master que reciba tu mensaje, mire la web
para fiarse y encuentre «10 %» pensará que le has mentido. Es lo primero que
cualquier persona cuidadosa va a mirar.

**Propuesta.** Una página `/fundadores`, con el texto que ya está redactado al
final de `oferta-fundador.md` (5 %, 0 % con código, permanentes, retirables solo
por incumplir las normas, sin promesas de volumen), y un enlace desde
`/para-game-masters` («¿Eres de los primeros? Mira las condiciones de
fundador»). **La portada no se toca**: es el escaparate del jugador y sigue
diciendo el 10 %, que es la comisión estándar.

**Tamaño.** Una página estática más un enlace. Sin base de datos.
**Cuándo.** Antes de escribir el primer mensaje: es lo que respalda por escrito
lo que prometes por Instagram. Es también el sitio donde el fundador puede leer
sus condiciones cuando le apetezca, que a día de hoy no existe.

**Decisión para ti.** La página debe ser pública (la ve cualquiera, aunque la
web lleva `noindex`) o accesible solo con enlace. Recomiendo **pública**: una
oferta que no se puede enseñar parece un apaño.

## 2. Una frase en `/privacidad` sobre los contactos

**Qué pasa hoy.** `/privacidad` dice «no te enviamos comunicaciones
comerciales», pensando en usuarios. No dice nada de personas que **no** son
usuarias y a las que se escribe una vez para ofrecerles la web. El art. 14 del
RGPD lo cumples en los propios mensajes (quién eres, de dónde sacaste el dato y
cómo dejar de recibirlos), pero conviene que la política de la web también lo
recoja.

**Propuesta.** Un párrafo corto: qué datos se tratan de esas personas (su
usuario público y, si lo publican como contacto profesional, su correo), para
qué (proponerles formar parte de la web), de dónde salen (perfiles públicos), y
cuánto se conservan (unos 6 meses si no hay respuesta, borrados si lo piden). El
registro de contactos sigue **fuera del repositorio**, como ya está dicho.

**Tamaño.** Un párrafo. **Cuándo.** En el mismo commit en que se empieza a
escribir a gente: así lo dice `CLAUDE.md` («un proveedor nuevo que trate datos
personales […] se añade a `/privacidad` en el mismo commit»), y es la misma
lógica. **Revisa el texto exacto con el asesor** si lo ves: es la única de estas
propuestas con consecuencia legal.

## 3. Aviso al fundador cuando le nombras

**Qué pasa hoy.** Al pulsar «Hacer fundador», a la persona no le llega nada: ni
correo ni aviso en la campanita. Se entera porque se lo dices tú, o porque
aparece el distintivo. No hay forma de que sepa por sí mismo que ya puede
publicar con sus condiciones ni dónde está su código (`modules/profiles/service.ts`,
`cambiarPlanGm`).

**Propuesta.** Un correo («Ya eres game master fundador») con su código, su
enlace y la frase de las condiciones, enviado por el mismo camino que los demás
avisos: plantilla pura en `notifications/plantillas.ts`, envío **fuera** de la
transacción y envuelto para que un fallo no rompa el nombramiento. Sin
`RESEND_API_KEY`, se vuelca al registro, como el resto.

**Tamaño.** Una plantilla, una función de envío, un test. **Cuándo.** No es
urgente: con los dos o tres primeros fundadores se lo dices tú, y es mejor, el
mensaje personal pesa más. Se justifica cuando el trato deje de ser uno a uno.
**Depende de** tener Resend con el dominio verificado, que ya está en la lista
de «antes de cobrar».

## 4. El código del fundador, en su panel

**Qué pasa hoy.** El código y el enlace viven en **`/cuenta/cobros`**, que es
«Mis ingresos». Es una pantalla de dinero, no de captación: un fundador que
busque su enlace para ponerlo en la bio no tiene razón para entrar ahí. El
panel (`/dashboard`) tiene una tarjeta de «Mis ingresos» pero no menciona el
código.

**Propuesta.** Una tarjeta «Tu código de fundador» en `/dashboard`, solo para
fundadores, con el código, el enlace, los botones de copiar que ya existen
(`CopiarBoton`) y la fecha hasta la que admite registros. La sección de
`/cuenta/cobros` se queda como está.

**Tamaño.** Una tarjeta, reutilizando `invitacionDeGm` y `CopiarBoton`. Sin
lógica nueva.

## 5. El tope de 10 en `/admin/game-masters`

**Qué pasa hoy.** La cabecera dice «N en total, M fundadores», pero **nada impide
nombrar un undécimo**. Con un clic se hace sin avisar. Y los botones «Hacer
fundador», «Quitar fundador» y «Código nuevo» **actúan al primer clic, sin
confirmar** (`ReservarBoton` no pide confirmación). «Código nuevo» invalida el
anterior: si el fundador ya lo tiene en su bio, el enlace deja de funcionar.

**Propuesta.** Dos cosas pequeñas:

- Mostrar `M/10` y, al llegar a 10, avisar al nombrar uno más. **Aviso, no
  bloqueo**: tú decides, pero que no sea por descuido.
- Confirmación en «Quitar fundador» y «Código nuevo», con una línea que diga
  qué consecuencia tiene.

**Tamaño.** Mínimo. La confirmación se haría en el botón, que se usa en más
sitios: hay que mirar que no estorbe en los demás.

## 6. Aviso cuando Stripe verifica la cuenta

**Qué pasa hoy.** Quien termina el formulario de Stripe vuelve a
`/cuenta/cobros?vuelta=1` y, si Stripe aún revisa, lee «Pulsa Comprobar estado
más tarde». No hay correo cuando la cuenta pasa a verificada: el game master
tiene que acordarse de volver. La campanita sí le recuerda «Configura tu cuenta
de cobro para poder publicar» mientras falta (`notifications/avisos.ts`).

**Propuesta.** Un correo breve al activarse `payoutsEnabled`: «Tus cobros están
listos, ya puedes publicar». Sale del webhook `account.updated`, que **ya existe**.

**Tamaño.** Una plantilla y una llamada en el webhook. **Cuándo.** Opcional: con
pocos fundadores, el recordatorio a mano basta. Sí merece la pena si vemos que
la gente se queda a medias.

## 7. El alta de Stripe: no es código, hay que decidirlo

Dos cosas que hoy están así y que importan **antes del primer alta real**:

- **Tipo de cuenta fijado a «persona física».** `connect.ts` crea las cuentas
  con `business_type: 'individual'`. Un game master que sea autónomo con
  actividad, o que lo haga a través de una asociación o una sociedad, no puede
  darse de alta como tal. No es un bug: es una decisión que acarrea fiscalidad,
  y es otro punto para el asesor. **No se cambia sin él.**
- **El nombre del negocio en Stripe** sale hoy como «Tu GM» en pantallas que el
  game master ve durante el alta (ya lo anoté en `oferta-fundador.md`). Es un
  ajuste del panel de Stripe, no de la web: hay que cambiarlo a «TuGameMaster»
  antes del primer alta. Un nombre que no coincide con la web asusta a quien está
  dando su IBAN.

Esto no requiere ninguna aprobación de código: son dos tareas tuyas.

## 8. Registro de por qué deja de ser fundador

**Qué pasa hoy.** «Quitar fundador» cambia el plan y nada más: ni fecha, ni
motivo, ni quién. Como te reservas el derecho de retirar la condición por
incumplir las normas, ese registro sirve el día que alguien lo discuta.

**Propuesta.** Un campo opcional de motivo y una fecha en la propia fila del
plan (o una tabla pequeña de cambios de plan), visible solo en
`/admin/game-masters`.

**Tamaño.** Pequeño pero toca el esquema de la base: **migración**, y
`CLAUDE.md` exige que sean compatibles hacia atrás porque producción migra sola.
**Cuándo.** Solo cuando haya un caso. Hasta entonces, el registro de contactos
fuera del repo (fecha y razón en una línea) cumple lo mismo.

---

## Lo que he mirado y NO propongo cambiar

- **El flujo del jugador con el enlace.** `/r/<código>` lleva al registro con el
  código puesto y el formulario dice de quién es. Si ya tiene cuenta y abre el
  enlace, la página le dice que ya está registrado y que puede reservar igual.
  Es honesto y sin atajos: no toco nada.
- **El código con Discord.** Entrar con Discord también conserva el código
  (`guardarCodigoDeViaje`), así que ese camino no pierde el emparejamiento.
- **El orden de las pantallas del game master.** Perfil → cobros → partida
  funciona y cada pantalla le avisa de lo que falta. La guía de alta lo
  explica, no hace falta rehacerlo.
- **Cambiar la comisión de la portada.** Sigue diciendo el 10 %, que es el caso
  de cualquiera salvo los diez primeros.

## Lo que no puedo comprobar desde aquí

- Que los dos **webhooks de Stripe** estén activos en modo real.
- Que **Resend** tenga el dominio verificado.
- Si el alta actual de Stripe recoge lo que pide **DAC7** (NIF y domicilio).
- Cuál es exactamente el plan de **Vercel**.

Son comprobaciones de tus paneles. Mientras no las hagas, ningún fundador debe
cobrar dinero real.
