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
