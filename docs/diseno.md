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
