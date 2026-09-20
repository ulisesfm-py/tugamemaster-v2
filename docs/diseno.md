# Diseño: inventario y auditoría

Este documento es el punto de partida del rediseño. Recorre las 24 páginas que
existen, dice para quién es cada una y **qué le falta**, y recoge los huecos
que no son de una página concreta sino de toda la web.

Es un documento vivo: se actualiza a medida que se toman decisiones.

## Decisiones ya tomadas

| Decisión          | Elección                                                                   |
| ----------------- | -------------------------------------------------------------------------- |
| Tono              | **Sobrio con personalidad.** Detalles de color y botones con carácter      |
| Público principal | **El jugador.** La portada es su escaparate; al GM se le capta más abajo   |
| Tema              | **Solo oscuro**, por ahora. Paleta de taberna: cálida, acogedora, chimenea |

**Por qué sobrio.** La web mueve dinero, reembolsos y reputación. Una interfaz
de pergamino y dragones resta credibilidad justo donde hay una tarjeta de por
medio. Lo evocador lo aportan las imágenes de las partidas y la paleta cálida;
la estructura se mantiene legible y seria.

**Por qué solo un tema.** Mantener claro y oscuro es gratis en Tailwind pero
duplica las decisiones en cada pantalla, y una de las dos siempre queda peor
cuidada. Mejor uno bien hecho y añadir el otro más adelante si hace falta.

## Lo que falta en toda la web

Estos cuatro huecos afectan a casi todas las páginas y hay que resolverlos
antes de tocar ninguna en concreto.

### 1. No hay navegación

Los grupos `(public)` y `(dashboard)` **no tienen layout propio**: solo existe
el de la raíz y el de autenticación. No hay cabecera, ni menú, ni pie. Cada
página enlaza a mano a las que el autor recordó en ese momento, y el resultado
es que **al blog solo se llega desde la portada**.

Sin esto, ninguna página es realmente navegable. Es lo primero que hay que
construir.

### 2. Los mensajes de éxito no se ven

Al reservar se escribe «Plaza confirmada. Esta partida es gratuita» y al
valorar «Gracias por valorar la partida». **El usuario no llega a ver ninguno
de los dos.** Al revalidar, el componente que los muestra lo sustituye el
nuevo estado de la página.

Funciona, pero se pierde el detalle que importa —sobre todo «se han usado 5 €
de tu saldo»—. Hace falta un patrón de confirmación que sobreviva a la
recarga. Ya existe uno en el proyecto: el `?pago=ok` con el que vuelve Stripe.

### 3. Faltan los estados que no son el feliz

Casi ninguna pantalla tiene diseñado el estado vacío, el de carga o el de
error. Hay algunos vacíos resueltos («No tienes ninguna partida próxima»), pero
no son un patrón: cada uno está escrito a su manera.

### 4. Los cambios de estado no se anuncian

Cuando un GM cancela su partida, su página **no dice en ningún sitio que esté
cancelada**: simplemente desaparecen los botones. El mismo problema aparece en
otras transiciones.

## Datos guardados que nadie ve

Esto es lo que salió de revisar el modelo contra las pantallas. El modelo está
bien cubierto campo a campo; lo que falla es que cierta información no llega a
la pantalla donde haría falta.

### Grave: el game master no ve su dinero

`/cuenta/cobros` muestra **solo si su cuenta de Stripe está verificada**. No
muestra cuánto ha ganado, qué le han pagado ya, qué tiene pendiente ni de
dónde sale cada cifra.

Y el desglose existe: cada reserva guarda `amountCents`, `commissionCents`,
`stripeFeeCents` y `payoutCents`, congelados en el momento del cobro. **Ninguno
de los cuatro se muestra en ninguna parte de la web.**

Es el hueco más serio del inventario: un marketplace donde el vendedor no
puede ver sus ingresos. Y la transparencia del reparto —precio, menos el 5%,
menos el coste real de la pasarela— es justamente un argumento de venta.

### Grave: el game master no se entera de las incidencias

Las incidencias solo se ven en `/mis-reservas` (el jugador que reclama) y en
`/admin/incidencias` (quien resuelve). **El GM afectado no las ve.** Si un
jugador reclama y con ello se bloquea el pago, el GM descubre que no le han
pagado sin saber por qué.

Tampoco ve el estado de su `Payout`, que puede estar en `BLOCKED` o `FAILED`
con un motivo escrito al lado.

### Menor

- **`Campaign.isOpen`** existe en el modelo y no se usa en ningún sitio. O se
  le da un significado en la interfaz (campaña abierta a gente nueva) o se
  quita del modelo.
- **`ScheduledJob`** solo se escribe; nadie lo lee. Un administrador no puede
  comprobar si el cron corrió anoche ni qué hizo.
- **El panel del jugador (`/dashboard`) es un andamio.** Dice «Aquí irá tu
  panel» y enseña una lista de depuración: email, perfil público y
  «Administrador: Sí/No». No hay próxima partida, ni saldo, ni nada accionable.

## Datos que el diseño necesita y el modelo no tiene

**`Game` no tiene imagen.** Las tarjetas que quieres —«imagen del juego
grande»— necesitan un campo que hoy no existe. `Post` sí tiene `coverUrl` y la
subida a Vercel Blob ya está montada y compartida en `lib/imagen`, así que
añadirlo es pequeño: una columna opcional, un campo en el formulario del GM y
reutilizar el componente de portada del blog.

Hay que decidir además **qué se ve cuando el GM no sube imagen**, que será el
caso más común al principio. Opciones: un color derivado del sistema de juego,
una ilustración por defecto, o una composición tipográfica con el título.

## Las 24 páginas

### Públicas

| Ruta               | Para quién       | Qué muestra hoy                                                                                       | Qué falta                                                                                                  |
| ------------------ | ---------------- | ----------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `/`                | Visitante        | Título, un párrafo, cuatro botones y una nota de fase                                                 | **Todo.** Banner, carrusel de partidas, propuesta de valor, cómo funciona, prueba social, captación de GMs |
| `/partidas`        | Jugador          | Filtros (texto, sistema, precio máximo, solo libres) y tarjetas                                       | Imagen en la tarjeta. Ordenación. Qué pasa cuando no hay resultados                                        |
| `/partidas/[slug]` | Jugador          | Título, sistema, fecha, GM, descripción, idiomas, precio, plazas, reservar, nota de sesión            | Imagen. Reputación del GM visible aquí. Qué incluye el precio. Quién más viene                             |
| `/gm/[slug]`       | Jugador decidido | Avatar, titular, estrellas, reputación verificada, idiomas, cómo dirige, próximas, historial, reseñas | Es de las más completas. Falta jerarquía: hoy todo pesa igual                                              |
| `/u/[slug]`        | Curioso          | Avatar, partidas jugadas, bio, sistemas y estilos preferidos, historial                               | Poco que añadir. Aquí irían los personajes cuando se hagan                                                 |
| `/campanas/[slug]` | Jugador          | Título, resumen, GM, sesiones en orden, aviso de continuidad                                          | Imagen. Distinguir mejor la sesión abierta de las ya jugadas                                               |
| `/blog`            | Visitante        | Listado con portada, resumen, autor, fecha, likes y comentarios                                       | Correcto. Falta poder llegar hasta aquí desde cualquier página                                             |
| `/blog/[slug]`     | Lector           | Portada, cuerpo, like, comentarios                                                                    | Tipografía de lectura larga. Artículos relacionados                                                        |
| `/condiciones`     | Jugador con duda | Las condiciones de cancelación, sacadas de `politica.ts`                                              | Correcto. Enlazarla desde el pie                                                                           |

### Entrar y registrarse

| Ruta        | Qué muestra hoy                           | Qué falta                                                     |
| ----------- | ----------------------------------------- | ------------------------------------------------------------- |
| `/login`    | Email, contraseña, Discord, enlace a alta | Tiene layout propio: es la ocasión de que diga a dónde entras |
| `/registro` | Alta con los mismos campos                | Ídem. Y explicar qué se gana registrándose                    |

### Del usuario

| Ruta                                     | Qué muestra hoy                                      | Qué falta                                                               |
| ---------------------------------------- | ---------------------------------------------------- | ----------------------------------------------------------------------- |
| `/dashboard`                             | Saludo, datos de depuración, botones, salir          | **Rehacerla entera.** Próxima partida, saldo, avisos, accesos           |
| `/cuenta`                                | Foto, nombre, bio, sistemas y estilos, saldo         | Correcta de contenido                                                   |
| `/cuenta/gm`                             | Titular, cómo dirige, idiomas, aviso de cobros       | Correcta                                                                |
| `/cuenta/cobros`                         | Solo el estado de verificación en Stripe             | **Los ingresos.** Cobrado, pendiente, pagado, y el desglose por partida |
| `/cuenta/saldo`                          | Saldo, movimientos, cómo funciona                    | Correcta. Es de las mejores que hay                                     |
| `/mis-reservas`                          | Próximas, historial, incidencias, valorar            | Mucha información apilada sin jerarquía                                 |
| `/cuenta/partidas`                       | Listado con estado, precio y plazas                  | Ingresos por partida. Avisar de incidencias                             |
| `/cuenta/partidas/nueva`                 | Formulario                                           | Imagen. Vista previa de cómo quedará la tarjeta                         |
| `/cuenta/partidas/[gameId]`              | Acciones, campaña, nota de sesión, jugadores, editar | Estado actual visible. Incidencias. Lo que va a ganar                   |
| `/cuenta/partidas/[gameId]/continuacion` | Nota anterior y formulario precargado                | Correcta                                                                |

### Administración

| Ruta                   | Qué muestra hoy                                | Qué falta                             |
| ---------------------- | ---------------------------------------------- | ------------------------------------- |
| `/admin/incidencias`   | Incidencias con su reserva, importe y acciones | Funcional. Solo necesita orden visual |
| `/admin/blog`          | Artículos con estado y contadores              | Correcta                              |
| `/admin/blog/nuevo`    | Formulario                                     | Correcta                              |
| `/admin/blog/[postId]` | Acciones, portada, contenido                   | Correcta                              |

No hay índice de administración: se llega a cada sección desde el panel.
Tampoco hay forma de ver la salud del cron ni las cuentas de los GMs.

## Orden de trabajo propuesto

1. **Dirección visual.** Dos o tres paletas y tipografías aplicadas a la misma
   pantalla real, para elegir comparando.
2. **El esqueleto.** Cabecera, pie, layouts de `(public)` y `(dashboard)`,
   shadcn/ui y los tokens de color, tipografía y espaciado.
3. **Componentes.** Botones, tarjetas, formularios, etiquetas de estado,
   estados vacíos y los patrones de confirmación y error.
4. **Páginas públicas.** Portada, listado, detalle, perfil de GM, campaña, blog.
5. **Páginas privadas.** Panel, mis reservas, cobros, gestión de partidas.
6. **Administración y pasada final.** Móvil, accesibilidad, estados que faltan.

Los huecos de datos (imagen de partida, ingresos del GM, incidencias del GM)
son trabajo funcional, no visual. Conviene resolverlos **antes** de rediseñar
las páginas donde aparecen, para no tener que rehacerlas dos veces.

---

# D1b · Contenido de las páginas

Definir qué va en cada pantalla **antes** de decidir qué datos añadir. Así los
campos nuevos salen de una necesidad real y no de una suposición.

Notación: los datos marcados **(falta)** no existen hoy y habría que añadirlos;
los marcados **(derivable)** se pueden calcular con lo que ya hay.

## Portada `/`

**Trabajo de esta página:** que alguien que no conoce la web entienda en diez
segundos qué es, vea mesas a las que apuntarse y se fíe lo suficiente para
pulsar una.

| Bloque                   | Contenido                                                                       | Datos                             |
| ------------------------ | ------------------------------------------------------------------------------- | --------------------------------- |
| 1. Cabecera y banner     | Nombre, una frase de qué es esto, imagen de fondo                               | Estático                          |
| 2. **Partidas abiertas** | Fila horizontal de tarjetas: imagen, título, sistema, fecha, GM, precio, plazas | `Game` + **imagen (falta)**       |
| 3. Cómo funciona         | Tres pasos: eliges mesa, pagas tu plaza, juegas                                 | Estático                          |
| 4. La garantía           | Qué pasa si el GM no aparece, cómo se cancela, qué es el saldo                  | Estático, sacado de `politica.ts` |
| 5. Game masters          | Tres o cuatro perfiles con estrellas y partidas dirigidas                       | `reputacionGm` (ya existe)        |
| 6. ¿Diriges tú?          | Captación de GMs: cómo se cobra, qué comisión, cómo se empieza                  | Estático                          |
| 7. Del blog              | Dos o tres artículos recientes                                                  | `listarPosts` (ya existe)         |

**Sobre el carrusel.** Te propongo una variante y te explico por qué. Un
carrusel clásico —el que rota solo y enseña una cosa cada vez— esconde el
catálogo: la mayoría de la gente solo ve la primera tarjeta. Como las partidas
son el producto, conviene que se vean varias a la vez.

Lo que propongo es una **fila deslizable** tipo Netflix: se ven tres o cuatro
tarjetas completas, se arrastra para ver más y hay un enlace claro a «ver
todas». Se siente como un carrusel, pero no esconde el catálogo ni se mueve
solo.

**Qué partidas salen ahí:** las publicadas, con plazas libres, ordenadas por
fecha de inicio. Sin campo de «destacada» por ahora: eso es una decisión
comercial que no toca tomar todavía.

## Perfil del game master `/gm/[slug]`

**Trabajo de esta página:** que alguien decida darle 15 € a un desconocido. Es
la página de confianza de la web.

La regla que la ordena: **separar con una línea clara lo que certifica la
plataforma de lo que cuenta el GM de sí mismo.** Lo primero no se puede
falsear y es lo que vale; lo segundo es presentación.

| Bloque               | Contenido                                                                               | Datos                                   |
| -------------------- | --------------------------------------------------------------------------------------- | --------------------------------------- |
| 1. Identidad         | Avatar, nombre, titular, idiomas, «en TuGameMaster desde…»                              | `User`, `GmProfile`, `createdAt`        |
| 2. **Verificado**    | Estrellas y nº de reseñas, partidas dirigidas, jugadores distintos, partidas canceladas | `reputacionGm` + **(derivable)**        |
| 3. Cómo dirige       | Texto libre del GM: estilo de mesa, qué esperar, tono                                   | `GmProfile.about`                       |
| 4. Lo que cuenta él  | Años de experiencia, sistemas que domina                                                | **(falta)**                             |
| 5. Próximas partidas | Tarjetas con plazas libres y precio                                                     | Ya existe                               |
| 6. Campañas          | Las que dirige, con su estado                                                           | `Campaign` (existe, no se muestra aquí) |
| 7. Reseñas           | Estrellas, comentario, autor, partida                                                   | Ya existe                               |
| 8. Historial         | Partidas dirigidas ya jugadas                                                           | Ya existe                               |

**Sobre los años de experiencia.** Lo pediste y tiene sentido, pero es un dato
que el GM se pone a sí mismo: nadie puede comprobarlo. Va en el bloque 4, con
los demás datos declarados, y visualmente distinto del bloque verificado. Si se
mezclan, la palabra «verificado» deja de significar nada.

**Dos datos verificados que no estamos usando y valen mucho:**

- **Jugadores distintos** que han pasado por sus mesas, y cuántos **repiten**.
  Que alguien vuelva a jugar con el mismo GM es la señal más honesta que hay.
- **Partidas canceladas** por él. Es el riesgo real que corre quien reserva, y
  hoy no se ve en ninguna parte. Un GM que no cancela nunca merece que se sepa.

Los dos son **derivables** de lo que ya está guardado. Ninguno necesita campo
nuevo.

## Panel del jugador `/dashboard`

**Trabajo de esta página:** decirte qué tienes pendiente y llevarte a ello. Hoy
es un andamio con datos de depuración.

| Bloque               | Contenido                                                          | Datos                          |
| -------------------- | ------------------------------------------------------------------ | ------------------------------ |
| 1. Próxima partida   | La más cercana: imagen, cuándo, GM, enlace, cuenta atrás           | `misReservas` (ya existe)      |
| 2. **Te toca hacer** | Valorar una partida jugada, incidencia resuelta, reserva sin pagar | **(derivable)**                |
| 3. Saldo             | Disponible y enlace a movimientos                                  | `saldoDe` (ya existe)          |
| 4. Tus próximas      | Las demás reservas confirmadas                                     | Ya existe                      |
| 5. Descubrir         | Enlace a partidas, filtrado por sus sistemas preferidos            | `preferredSystems` (ya existe) |

El bloque 2 es el que más valor aporta y no existe: hoy, si una partida tuya
terminó y puedes valorarla, no te enteras salvo que entres a Mis reservas.

## Panel del game master

**Trabajo de esta página:** decirle si puede cobrar, qué mesas tiene, quién
viene y cuánto va a ganar.

| Bloque                      | Contenido                                                                          | Datos                                 |
| --------------------------- | ---------------------------------------------------------------------------------- | ------------------------------------- |
| 1. Aviso de cobros          | Si no está verificado, esto manda sobre todo lo demás                              | `payoutsEnabled` (ya existe)          |
| 2. **Necesita tu atención** | Incidencia abierta, pago bloqueado, sesión sin nota, partida que puede continuarse | **(derivable)**                       |
| 3. Próxima que diriges      | Cuándo, quién viene, plazas por llenar                                             | Ya existe                             |
| 4. **Ingresos**             | Cobrado, pendiente de pago, ya pagado                                              | **(derivable)** de `Booking`/`Payout` |
| 5. Tus partidas             | Listado con estado, ocupación e ingreso previsto                                   | Ya existe + desglose                  |
| 6. Crear partida            | Acceso destacado                                                                   | —                                     |

### ¿Uno o dos paneles?

Un usuario puede ser jugador y GM a la vez, y hoy conviven `/dashboard` y
`/cuenta/partidas` sin relación clara.

**Mi recomendación: un solo panel que se adapta.** Siempre enseña la parte de
jugador; si tienes perfil de GM, aparece además la de game master. Razones:
casi todos los GMs juegan también, dos paneles obligan a elegir «con qué
sombrero entro», y la lista de «te toca hacer» es más útil junta que repartida.

La alternativa —dos espacios separados con un conmutador— tiene sentido si
esperas GMs profesionales con muchas mesas, para los que la parte de jugador
sería ruido. Es una decisión tuya sobre a quién esperas.

## Lo que hace falta añadir, hasta ahora

De definir estas cuatro páginas salen estos datos. La lista crecerá al definir
el resto.

**Campos nuevos en el modelo:**

| Dato                | Dónde       | Para qué                                 |
| ------------------- | ----------- | ---------------------------------------- |
| Imagen de partida   | `Game`      | Tarjetas de la portada y del listado     |
| Años de experiencia | `GmProfile` | Bloque «lo que cuenta él» del perfil     |
| Sistemas que domina | `GmProfile` | Ídem, y para filtrar por GM más adelante |

**Consultas nuevas, sin tocar el modelo:**

| Dato                              | Se deriva de                                |
| --------------------------------- | ------------------------------------------- |
| Jugadores distintos y repetidores | `Booking` agrupado por usuario              |
| Partidas canceladas por el GM     | `Game.status = CANCELLED`                   |
| «Te toca hacer» del jugador       | Reservas jugadas sin reseña, incidencias    |
| «Necesita tu atención» del GM     | Incidencias abiertas, `Payout` bloqueado    |
| Ingresos del GM                   | `Booking.payoutCents` y estado del `Payout` |

---

# D1c · Referencia: StartPlaying

Estudio de la web de referencia para entender **qué información maneja** y qué
nos falta a nosotros. No se copia ni su estructura visual ni sus textos: lo que
interesa es el inventario de datos y los caminos de navegación.

## La diferencia de modelo, que lo condiciona todo

Antes de comparar pantallas hay que ver que **no vendemos lo mismo**.

|                 | StartPlaying                                    | TuGameMaster                                   |
| --------------- | ----------------------------------------------- | ---------------------------------------------- |
| Unidad de venta | La **campaña**: te apuntas a una mesa que sigue | La **partida**: reservas una fecha concreta    |
| Cobro           | Por sesión, al empezar cada una                 | Una vez, al reservar                           |
| Compromiso      | Alto. Hay campañas por la sesión 84             | Bajo. Pruebas una tarde y ya verás             |
| Continuidad     | Es el producto                                  | Opcional: el GM crea la continuación si quiere |
| Dónde se juega  | Solo en línea                                   | Sin definir                                    |

Su modelo retiene mejor; el nuestro tiene menos fricción para entrar. **El
nuestro es más fácil de probar**, y eso importa en un mercado sin costumbre de
pagar por dirigir. Conviene apoyarse en ello en vez de disimularlo: «reserva una
tarde, sin suscribirte a nada» es un argumento, no una carencia.

## Lo que ellos muestran y nosotros no

### En la ficha de una partida

Su página de partida lleva una **ficha técnica** que responde a «¿es esta mesa
para mí?» antes de leer la descripción:

| Dato                     | Lo tenemos | Comentario                                                  |
| ------------------------ | ---------- | ----------------------------------------------------------- |
| Tipo: one-shot o campaña | No         | En nuestro modelo se deduce, pero no se anuncia             |
| Sistema                  | Sí         | Ellos admiten varios a la vez                               |
| Nivel de personajes      | No         | Solo aplica a algunos sistemas                              |
| Idioma de la mesa        | En el GM   | Debería estar en la partida: un GM bilingüe dirige en ambos |
| Experiencia requerida    | **No**     | «Abierta a todos» / «se presupone soltura»                  |
| Edad mínima              | **No**     | Relevante y hoy invisible                                   |
| Duración de la sesión    | Sí         | La calculamos pero no la enseñamos                          |
| Etiquetas de estilo      | **No**     | Combate, exploración, interpretación…                       |
| Etiquetas de tema        | **No**     | Terror, fantasía oscura, humor…                             |

**Esta es la mayor laguna de contenido que tenemos.** Hoy alguien que entra en
una partida nuestra sabe qué sistema es, cuándo y cuánto cuesta, pero no si le
va a encajar. Y es justo lo que decide si se apunta.

### En la tarjeta del listado

Su tarjeta dice, además de lo que decimos nosotros:

- **Estado en forma de urgencia**: «faltan 3 para empezar», «queda 1 plaza».
  Nosotros decimos «2 de 6 plazas ocupadas», que es el mismo dato contado de la
  forma menos motivadora.
- **Nota del GM y número de reseñas**, ahí mismo. Nosotros no lo llevamos a la
  tarjeta, y es lo que más ayuda a elegir entre dos.
- **Distintivo de GM destacado**.

### En el perfil del game master

Señales de confianza que ellos muestran y nosotros no:

- **Antigüedad** en la plataforma y **partidas dirigidas** (esto sí lo tenemos).
- **Tasa de respuesta y tiempo medio de respuesta.** Solo tiene sentido si hay
  mensajería, que nosotros no tenemos.
- **«Destaca por…»**, etiquetas derivadas de lo que dicen sus reseñas.
- **Distintivos**: escribe para tal editorial, pódcast, mesa LGTBQ+, sin IA
  generativa. Es identidad declarada, no verificada.
- **Pronombres** junto al nombre.

Lo que nosotros vamos a tener y ellos no: **jugadores distintos y repetidores**,
y **partidas canceladas**. Son más difíciles de falsear que cualquier
distintivo, porque salen de reservas pagadas.

### En la navegación

Su menú tiene cuatro cosas: buscar partidas, **buscar game masters**, entrar y
registrarse. Nosotros no tenemos menú, y tampoco **directorio de GMs**: hay
perfiles, pero no hay forma de recorrerlos.

Y en el buscador usan **fichas de descubrimiento** —juega hoy, quedan pocas
plazas, para principiantes, campañas nuevas— que son atajos curados por encima
de los filtros. Son baratas de hacer y quitan el problema de la página en blanco.

### Garantía

La suya aparece **en la propia página de la partida**, junto al precio, no
escondida en un enlace legal. Nosotros tenemos la nuestra —90%, 100% si el GM
no aparece, saldo que no caduca— y la enseñamos solo en `/condiciones` y en una
línea pequeña bajo el botón.

## En qué nos podemos diferenciar

1. **España, en serio.** Todo en español, horarios en hora peninsular, precios
   en euros y con el IVA claro. Ellos son una web en inglés donde el español es
   una excepción.
2. **Presencial.** StartPlaying es solo en línea. Aquí hay cultura de tienda, de
   asociación y de jornadas. Permitir partidas presenciales —con su sitio y su
   aforo— es el hueco más grande que dejan libres. **Es una decisión de producto
   que hay que tomar**, porque afecta al modelo de datos (lugar, dirección,
   cómo se muestra) y al de confianza.
3. **Compromiso bajo.** Reservar una tarde suelta en vez de entrar en una
   campaña de meses.
4. **Continuidad sin suscripción.** Nuestras notas de sesión y las
   continuaciones reservadas a quienes jugaron son un modelo propio: la campaña
   nace sola si la mesa funciona, sin que nadie firme nada.

## Estructura propuesta para nuestra web

### Públicas

| Ruta                    | Estado    | Qué es                                                           |
| ----------------------- | --------- | ---------------------------------------------------------------- |
| `/`                     | Rehacer   | Escaparate: banner, partidas abiertas, cómo funciona, garantía   |
| `/partidas`             | Mejorar   | Buscador con filtros **y fichas de descubrimiento**              |
| `/partidas/[slug]`      | Mejorar   | Ficha técnica completa + garantía junto al precio                |
| `/gm`                   | **Nueva** | Directorio de game masters, con filtros                          |
| `/gm/[slug]`            | Mejorar   | Verificado arriba, declarado abajo                               |
| `/campanas/[slug]`      | Mejorar   | Igual, con imagen y estado de cada sesión                        |
| `/u/[slug]`             | Retocar   | Perfil de jugador                                                |
| `/como-funciona`        | **Nueva** | Para el jugador con dudas: pago, garantía, qué pasa si falla     |
| `/para-game-masters`    | **Nueva** | Captación: comisión, cuándo se cobra, cómo se empieza            |
| `/sistemas/[nombre]`    | **Nueva** | Una página por sistema. Es la puerta de entrada desde buscadores |
| `/blog`, `/blog/[slug]` | Retocar   | Ya está bien                                                     |
| `/condiciones`          | Retocar   | Enlazada desde el pie y desde cada partida                       |

### Cuenta

`/dashboard` adaptativo (jugador siempre, GM si lo es), `/mis-reservas`,
`/cuenta`, `/cuenta/gm`, `/cuenta/saldo`, `/cuenta/cobros` **con ingresos**,
`/cuenta/partidas` y sus hijas.

### Administración

Lo que hay, más un índice y una página de salud del cron.

## Lo que NO copiamos

- **Mensajería directa.** Ellos la tienen y de ahí salen la tasa y el tiempo de
  respuesta. Abre moderación, acoso y responsabilidad. Al backlog.
- **Cobro por sesión.** Es otro modelo de negocio, no una mejora del nuestro.
- **Distintivos de identidad** (LGTBQ+, sin IA…). Tiene valor, pero abre una
  discusión de moderación que ahora mismo no toca.
- **Seguir una partida.** Útil, pero secundario frente a lo demás.

---

# D1d · Hilo de mesa y centro de avisos

Dos piezas que se decidieron juntas porque son la misma: un hilo de conversación
por partida, y una campanita que avisa de lo que pasa en ella **y de todo lo
demás que hoy no se entera nadie**.

Se especifican ahora para que el diseño las contemple. **Se construyen después
del diseño**, como fase propia.

## El hilo de mesa

Un hilo **asíncrono** por partida, no un chat en tiempo real. Por fuera se
parece; por dentro no mantiene conexiones abiertas, que en Vercel son incómodas
y se pagan. Y el uso real es asíncrono: la duda llega tres días antes y el
recordatorio la víspera.

| Regla        | Decisión                                                                  |
| ------------ | ------------------------------------------------------------------------- |
| Ámbito       | Uno por partida. Sin herencia entre sesiones de una campaña               |
| Quién entra  | El GM y quien tenga reserva pagada                                        |
| Quién sale   | Quien libera su plaza. Sus mensajes se quedan; deja de leer y de escribir |
| Cuándo muere | Lo borra el GM, o la limpieza diaria pasados N días del fin de la partida |
| Correo       | **Ninguno.** Los avisos van por la campanita                              |
| Expulsar     | El GM **no** puede. Denuncia, y decide un administrador                   |

**Por qué el GM no expulsa.** Sacar del hilo a alguien que ha pagado es
quitarle algo que compró. Si hay que apartar a una persona, va con devolución
por delante y lo decide quien puede devolver el dinero.

**Moderación**: denunciar un mensaje lleva el caso al panel de administración,
con el mismo patrón que las incidencias.

## El centro de avisos

Una campanita en la cabecera. Al abrirla, la lista de lo que te espera; al
pulsar un aviso, te lleva al sitio.

**La clave del diseño: casi todo son estados, no sucesos.** «Tienes una partida
sin valorar» no es algo que ocurrió, es algo que es cierto ahora y deja de
serlo al valorar. Por eso **se calcula, no se guarda**: sin tabla de
notificaciones que mantener y sin avisos fantasma.

### Lo que enseña

| Aviso                             | A quién | De dónde sale                      |
| --------------------------------- | ------- | ---------------------------------- |
| Mensajes nuevos en una partida    | Ambos   | Marca de lectura del hilo          |
| Puedes valorar una partida jugada | Jugador | Reserva `COMPLETED` sin reseña     |
| Tu incidencia se ha resuelto      | Jugador | `Incident` resuelta                |
| El game master canceló la partida | Jugador | Reserva `REFUNDED` por cancelación |
| Tienes saldo sin usar             | Jugador | `WalletEntry` con suma positiva    |
| Alguien se ha apuntado            | GM      | Reservas recientes                 |
| Hay una incidencia en tu partida  | GM      | `Incident` abierta                 |
| Tu pago está bloqueado            | GM      | `Payout` en `BLOCKED`              |
| Te hemos pagado                   | GM      | `Payout` en `PAID`                 |
| Sesión sin nota                   | GM      | Partida jugada sin `SessionNote`   |
| No puedes publicar sin cobros     | GM      | `payoutsEnabled` en falso          |

Es la misma lista que alimenta los bloques **«te toca hacer»** y **«necesita tu
atención»** de los paneles. Una pieza, dos sitios donde se asoma.

### Lo único que hay que guardar

Hasta dónde ha leído cada uno cada hilo. Eso no se deduce de nada: usuario,
partida y fecha de última lectura. Con eso salen los mensajes sin leer.

Para los avisos de estado no hace falta marca: dejan de aparecer cuando dejan
de ser ciertos.

### Cómo se actualiza

Al navegar, no con sondeos ni conexiones abiertas. Para algo asíncrono es de
sobra, y no cuesta nada mantenerlo.

## Datos nuevos que hacen falta

| Dato                | Dónde        | Para qué                         |
| ------------------- | ------------ | -------------------------------- |
| Mensajes del hilo   | Tabla nueva  | El hilo en sí                    |
| Marca de lectura    | Tabla nueva  | Saber qué es nuevo para cada uno |
| Denuncia de mensaje | Reutilizable | Mismo patrón que las incidencias |

## Páginas que toca

- **Cabecera** (nueva, D3): la campanita y su panel desplegable.
- **`/partidas/[slug]`**: el hilo, visible solo para la mesa. Junto a la nota de
  sesión, que tiene el mismo criterio de acceso.
- **Paneles**: los bloques de pendientes, alimentados por lo mismo.

## Riesgo de negocio: la desintermediación

Dar un canal de comunicación facilita que el GM y sus jugadores se pasen el
contacto y jueguen la siguiente por fuera, sin comisión. Le pasa a todas las
plataformas de este tipo y **no tiene solución técnica**; perseguirlo suele
salir peor que el problema.

La defensa es que volver a la web compense: la garantía, el historial y la
reputación. Es un argumento más para que la garantía se vea bien y para que el
historial del GM valga algo.

---

# D2 · Dirección elegida: Brasa

Naranja de ascua sobre madera quemada. **Tema único y oscuro**: no hay variante
clara, así que los tokens de `:root` son los definitivos y no los de un modo
entre dos.

| Token                     | Valor                 | Para qué                                               |
| ------------------------- | --------------------- | ------------------------------------------------------ |
| `--background`            | `#17120e`             | El fondo de todo                                       |
| `--card` / `--popover`    | `#201a15`             | Lo que se levanta sobre el fondo                       |
| `--secondary` / `--muted` | `#2a221b` / `#241d17` | Superficies intermedias                                |
| `--foreground`            | `#f5ece2`             | Tinta                                                  |
| `--muted-foreground`      | `#ab9b8a`             | Tinta secundaria                                       |
| `--primary`               | `#e2622a`             | **El ascua.** Un solo acento, y se gasta donde importa |
| `--accent`                | `#c9973f`             | Latón: reputación y detalles cálidos                   |
| `--destructive`           | `#c2383f`             | Peligro                                                |
| `--success` / `--warning` | `#6f9f5b` / `#d99b2b` | Estados                                                |
| `--radius`                | `0.25rem`             | Brasa es de esquinas cortas: el cartel, no la pegatina |

**Los estados no comparten tono con el acento.** Si «peligro» y «reservar» se
parecen, uno de los dos miente.

**Tipografía**: Bricolage Grotesque para títulos (tiene carácter y aguanta el
tamaño grande) y Barlow para todo lo demás (ligeramente estrecha, así que cabe
más en una tarjeta sin apretar). Dos familias y solo dos.

**Taberna queda descartada como tema alternativo**, de momento. El coste no es
construirla sino mantenerla: cada componente nuevo habría que mirarlo dos
veces, y no son solo colores — el botón de Brasa es relleno con relieve y el de
Taberna era de perfil. Como todos los colores viven en tokens, añadirla más
adelante es definir doce valores y repasar las pantallas una vez, en vez de
repasarlas dos veces mientras se construyen.

# D3 · El esqueleto

## Lo que se ha construido

- **Cabecera** fija con marca, menú (Partidas · Game masters · Blog), campanita
  de avisos y acceso a la cuenta. Antes no había ninguna.
- **Pie** con tres columnas: jugar, dirigir y la casa.
- **Layouts** para `(public)`, `(dashboard)` y `admin`, los tres sobre un mismo
  `Cascaron`. Las páginas de entrar y registrarse se quedan sin él a propósito:
  allí el único trabajo es el formulario, y un menú solo invita a irse.
- **shadcn/ui** instalado, con su paleta por defecto sustituida por Brasa.
- **`/gm`**, el directorio de game masters, que la cabecera necesitaba. Solo
  lista a quienes pueden cobrar: un GM sin cuenta verificada no puede publicar,
  así que listarlo sería mandar a la gente a una puerta cerrada.

## El centro de avisos

La campanita ya es real, no un adorno: `modules/notifications/avisos.ts`
calcula lo que le espera a cada usuario. **Casi nada se guarda, se deriva** —
«tienes una partida sin valorar» deja de ser cierto en cuanto valoras. Los
pocos avisos que sí son sucesos, como una incidencia resuelta, se acotan por
ventana de tiempo para que caduquen solos.

Con esto se tapan dos de los huecos graves de la auditoría: **el game master ya
se entera de que hay una incidencia en su partida y de que su pago está
retenido.** Antes solo se enteraba de que no le habían pagado.

La misma lista alimentará los bloques «te toca hacer» y «necesita tu atención»
de los paneles.

## La migración de las páginas

`<html class="dark">` va fijo. Además de fijar el tema, hace que las clases
`dark:` que quedan del estilo anterior resuelvan por el lado correcto: las
páginas siguen viéndose bien mientras se migran a los tokens de Brasa **una a
una**, sin necesidad de rehacerlas todas de golpe.

## Dos errores que salieron al montarlo

- **Cancelar una partida no revalidaba su página pública.** La acción
  revalidaba el panel del GM y el listado, pero nunca `/partidas/[slug]`, así
  que la página seguía anunciando una partida ya cancelada. Corregido.
- **Una prueba E2E pasaba por suerte.** Comprobaba que el botón de cancelar
  desapareciera, pero eso también es cierto _mientras la acción corre_: su
  texto pasa a «Un momento...» y deja de coincidir. La prueba se iba a la
  siguiente página antes de que el servidor terminara. Ahora espera a una señal
  que solo aparece al terminar.

## Lo que queda pendiente de D3

Dos páginas que el pie querría enlazar y todavía no existen: `/como-funciona` y
`/para-game-masters`. Su contenido es estático y ya está decidido, pero merece
la pasada de diseño de D5 en vez de una versión apresurada ahora.

---

# D4 · Las piezas

Todo vive en `src/components/ui` y se ve junto en **`/estilo`**, una página que
no sale en el menú ni se enlaza desde ningún sitio. Existe para comprobar de
una pasada que dos cosas que deberían parecerse se parecen — mucho más rápido
que ir abriendo pantallas sueltas.

## Botón

Cinco variantes: `solido`, `perfil`, `fantasma`, `peligro` y `enlace`.

**Solo el sólido lleva relieve**, y por eso se reserva a la acción principal de
cada pantalla. Si hubiera tres botones con relieve, ninguno destacaría.

Está reescrito sobre el que genera shadcn: se conserva la forma (primitiva de
Base UI + cva) para que lo que se añada después encaje, pero las variantes son
las nuestras.

## Estados

Una sola tabla con los estados de partida, reserva, incidencia y pago, cada uno
con su texto y su tono. **El mismo significado tiene siempre el mismo color.**
Antes cada pantalla los traducía a su manera y no siempre coincidían.

Los tonos son semánticos y **no comparten color con el acento**: el ascua es
«pulsa aquí», nunca «esto va bien».

## Avisos

Cuatro tonos: éxito, error, atención y dato. El `role` no es decorativo — un
acierto se anuncia con `status` y un fallo con `alert`, que es lo que hace que
un lector de pantalla los lea sin que haya que ir a buscarlos.

## Formulario y estado vacío

`Campo` pone etiqueta, control, ayuda y error siempre en el mismo orden, con el
error enlazado al control por `aria-describedby`.

`Vacio` admite una acción: un hueco sin contenido casi siempre tiene algo que
la persona puede hacer, así que no se queda en «no hay nada».

## La tarjeta de partida

Es la pieza que más se repite, así que sus decisiones se ven en toda la web.

1. **Las plazas se cuentan como urgencia, no como inventario.** «Queda 1 plaza»
   y «2 de 6 ocupadas» dicen el mismo dato; el primero mueve a alguien.
2. **La nota del game master va en la tarjeta.** Es lo que más ayuda a elegir
   entre dos partidas parecidas, y antes había que entrar para verla.
3. **Hay lámina siempre.** Sin imagen propia —que será lo normal al principio—
   la compone el sistema de juego en grande, en vez de dejar un hueco gris.

Lo que no se puede hacer todavía: **«faltan 2 para empezar»**. Requiere un
mínimo de jugadores para arrancar, y el modelo no lo tiene. Queda anotado junto
al resto de campos pendientes.

## Un error que salió al mirarlo

`Avatar` pinta un `<div>` cuando no hay foto, y estaba metido dentro de un
`<p>`. Es HTML inválido y **rompía la hidratación** en el listado de partidas y
en el propio muestrario. Es justo el tipo de cosa que no se ve leyendo el
código y salta a la primera al abrir la consola.

---

# D5 · Las páginas

Por tandas: primero las públicas, que son las que venden; luego las privadas; y
al final administración.

## Portada `/`

Siete bloques: titular, **partidas abiertas**, cómo funciona, la garantía, quién
dirige, captación de game masters y el blog.

Las partidas van arriba del todo, justo detrás del titular, porque son el
producto: cualquier cosa que se ponga delante las retrasa. Se enseñan en una
**fila deslizable**, no en un carrusel: un carrusel que rota solo enseña una
cosa cada vez y casi nadie pasa de la primera; así se ven tres o cuatro enteras.

La garantía **sale de las constantes de `politica.ts`**, no de texto escrito a
mano. Si mañana cambia el 90%, cambia también en la portada. Y el ejemplo de
ingresos para game masters enseña el reparto entero —75 €, menos 3,75 € de
comisión, menos 2,85 € de pasarela, quedan 68,40 €— porque esa transparencia es
el argumento, no letra pequeña.

La portada vivía en la raíz y era la única página sin cabecera ni pie. Ahora
está en `(public)`.

## Ficha de una partida `/partidas/[slug]`

Era **la mayor laguna de contenido de la web**: quien entraba sabía qué sistema
era, cuándo y cuánto costaba, pero no si le iba a encajar. Y eso es justo lo que
decide si se apunta.

### Los datos que faltaban

Cinco columnas nuevas en `Game`, con su migración:

| Campo        | Para qué                                                      |
| ------------ | ------------------------------------------------------------- |
| `imageUrl`   | La lámina, en la tarjeta y en la ficha                        |
| `languages`  | El idioma **de la mesa**, no el del game master               |
| `experience` | Cuánta soltura se presupone: abierta, con rodaje, con soltura |
| `minAge`     | Edad mínima. Relevante y hasta ahora invisible                |
| `tags`       | Etiquetas de estilo y de tema                                 |

Tres decisiones dentro de eso:

**El idioma pasa a la partida.** Estaba solo en el perfil del game master, y un
GM bilingüe no dirige cada mesa en los dos idiomas. Las partidas que ya
existían heredaron los suyos en la migración, así que no se perdió ni se
inventó información; y las de un GM que no declaró ninguno siguen cayendo a los
del GM al leerlas.

**Las etiquetas son vocabulario cerrado**, en `modules/games/ficha.ts`. Texto
libre daría «Terror», «terror» y «TERROR» como tres cosas distintas, y con eso
no se filtra ni se agrupa. El grupo al que pertenece cada etiqueta vive en el
vocabulario, no en la base de datos: en `Game` hay **una sola columna**.

**Qué clase de mesa es no se guarda: se deduce.** Una partida con campaña o que
continúa a otra es una sesión de campaña; el resto son partidas sueltas. Es la
primera pregunta de quien mira y hasta ahora no se contestaba en ningún sitio.

### Cómo queda la página

Dos columnas. A la izquierda, **la ficha antes que la descripción**: contesta
«¿es esta mesa para mí?» en cinco segundos, y solo quien ya sabe que puede
encajar tiene motivo para leerse el resto. Debajo, la descripción, la nota de
sesión si la hay, y quién dirige con sus estrellas y sus partidas.

A la derecha, precio, plazas y botón, pegados al hacer scroll. **En móvil ese
bloque va primero**, antes que toda la ficha: quien llega decidido no tiene por
qué recorrerla entera.

Y **la garantía va junto al precio**, no escondida en un enlace legal. Es justo
donde aparece la duda de «¿y si sale mal?». Los números, otra vez, de
`politica.ts`.

## Enlaces que decían ser botones

Base UI marca con `role="button"` cualquier cosa que pinte a través de su
primitiva de botón. Con `render={<Link>}` eso produce un `<a href>` que un
lector de pantalla anuncia como **botón**: miente sobre lo que va a pasar al
pulsarlo y pierde lo que un enlace sabe hacer. Pasaba en la portada y se habría
repetido en cada página nueva.

Ahora hay `EnlaceBoton`, que solo toma las clases y deja el `<a>` en paz. La
regla: **si al pulsarlo se va a otra página, es `EnlaceBoton`; si ejecuta algo
en esta, es `Button`.**

## Otra prueba que pasaba por casualidad

La que comprueba que una partida del listado se puede abrir hacía clic y
verificaba «hay un encabezado con el título» y «4 de 4 plazas libres». Las dos
cosas **son ciertas también en el propio listado**, así que la prueba se daba
por buena sin haber llegado nunca a la ficha. Salió a la luz al añadirle una
comprobación de la ficha técnica, que encontró dos tarjetas en vez de una.

Lleva ya un `waitForURL`. Es el mismo error de la vez anterior con otra cara:
**una comprobación que se cumple antes de que pase lo que se quiere comprobar.**
