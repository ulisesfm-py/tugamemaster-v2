# Cómo grabar y montar un reel

Vale para todos los reels de esta carpeta. Cada guion (`0N-*.md`) dice **qué**
se graba; aquí está **cómo**, de principio a fin. La primera vez lleva una
tarde; a partir del segundo, una hora.

## Lo que necesitas

- **El móvil** con el que grabas la pantalla. La web se graba tal cual la ve un
  jugador: en el móvil, no en el ordenador.
- **Un editor de vídeo.** Esta guía usa **CapCut** (gratuito, en móvil y en
  ordenador), porque permite poner imágenes encima del vídeo como capas, que es
  lo que pide el montaje. Si usas otro, busca las mismas cuatro cosas: lienzo
  9:16, recortar, cambiar la velocidad y superponer una imagen.
- **Las piezas del reel**, generadas con:

  ```powershell
  node scripts/captacion/tarjetas-reels.mjs
  ```

  Salen en `docs/captacion/reels/tarjetas/<reel>/` (no se suben al repositorio).
  Pásalas al móvil, por ejemplo por Google Drive o por AirDrop.

## Las tres clases de pieza

| Archivo                 | Qué es                                                         | Cómo se usa                                                                    |
| ----------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `00-portada.png`        | La portada del reel.                                           | Se elige al publicar, como «portada». No va dentro del vídeo.                  |
| `escena-NN-tarjeta.png` | Una pantalla entera de texto, con fondo.                       | Va **en lugar de** grabación: es un clip más, de imagen fija.                  |
| `escena-NN-rotulo.png`  | El texto de una escena grabada, **con el fondo transparente**. | Va **encima** del clip de esa escena, como superposición, a pantalla completa. |

Los rótulos llevan el texto ya escrito con las letras de la marca. Así no hace
falta escribir nada en el editor, y todos los reels se ven iguales.

Todas las piezas respetan la **zona segura** de Instagram: nada en los 250 px de
arriba ni en los 400 px de abajo, donde Instagram pone el nombre de la cuenta, la
descripción y los botones. **No las muevas ni las escales**: colócalas a pantalla
completa y ya caen en su sitio.

## 1 · Preparar el móvil (5 minutos)

- **Modo «No molestar»** activado. Que no entre un WhatsApp a mitad de una toma.
- **Batería** por encima del 50 % y **brillo** alto. Con el ahorro de energía, la
  grabación puede ir a menos fotogramas.
- **Tamaño de letra del sistema en el normal.** Si lo tienes grande, la web se ve
  distinta a como la verá el resto.
- **Navegador:** el de siempre (Chrome o Safari), con **una sola pestaña** abierta
  en `tugamemaster.com` y la sesión ya iniciada. Nada de modo incógnito: la sesión
  no estaría.
- **El teclado:** quita las sugerencias o la corrección automática un rato si
  cambian palabras al escribir. Una «Vaktesniebla» en pantalla se ve en el reel.
- **Android:** en las opciones de desarrollador, «Mostrar toques» enseña dónde
  pulsas. Ayuda a seguir el vídeo. En el iPhone no existe; no pasa nada.

## 2 · Preparar la web (5 minutos)

- Lo que pida el apartado «Antes de grabar» del guion (lámina subida, partida
  creada, despliegue hecho…).
- **La campana sin avisos pendientes**, o que el número no salga en el encuadre.
- Repasa que **no salga nada privado**: ni ingresos, ni el correo de nadie, ni la
  contraseña de una partida que de verdad se esté usando.
- Abre una vez cada página que vayas a grabar, para que la segunda vez cargue al
  momento y no grabes la espera.

## 3 · Grabar (20–30 minutos)

**Cómo empezar a grabar la pantalla:**

- **iPhone:** desliza el Centro de control y toca el botón de grabación (un
  círculo dentro de otro). Si no está, se añade en Ajustes › Centro de control.
  Mantén pulsado el botón para ver si el micrófono está apagado: déjalo apagado.
- **Android:** desliza los ajustes rápidos y toca «Grabar pantalla». Elige **sin
  audio**.

**Cómo grabar cada escena:**

- **Un clip por escena**, no un vídeo largo. Si te equivocas, repites solo esa.
- Empieza a grabar, **espera 2 segundos sin tocar nada**, haz la escena y espera
  otros 2 antes de parar. Esos márgenes se recortan después y evitan que el corte
  caiga a mitad de un gesto.
- **Despacio.** Cada toque, como si se lo enseñaras a alguien al lado. Después
  se acelera lo que haga falta, pero lo que va demasiado rápido no se puede
  frenar.
- **Para un segundo encima de lo importante** (el botón que vas a tocar, el texto
  que dice el rótulo). Es donde mirará la gente.
- **Desplaza la página con un dedo y suave**, no a golpes: un desplazamiento
  brusco se ve borroso.
- **Lo que se escribe, se escribe entero.** Luego se acelera ×3–×4 y queda bien.
- Si en una escena no tienes que pulsar un botón (por ejemplo, «Crear borrador»),
  el guion lo dice. **Para la grabación antes de tocarlo.**
- Graba cada escena **dos veces** si dudas. Tirar un clip es gratis; volver a
  preparar la toma, no.

Al acabar, revisa los clips en la galería: que se lea, que no haya
notificaciones y que no salga nada privado.

## 4 · Montar en CapCut (30–45 minutos)

**Proyecto:**

1. Nuevo proyecto. Importa **todos los clips y las piezas en el orden de las
   escenas** (la escena 1 grabada, la tarjeta 2, la escena 3 grabada…). Los
   rótulos **todavía no**.
2. En «Formato» (o «Relación de aspecto»), elige **9:16**.

**Cada clip grabado:**

3. **Recorta el principio y el final** (los 2 segundos de margen).
4. **Encuadre:** la pantalla de un móvil es más alta que 9:16. Amplía el clip
   un poco hasta que llene el lienzo y súbelo o bájalo para que **no se vea la
   barra de estado** (hora, batería) **ni la barra de dirección** del navegador.
   Sobra arriba y abajo; nunca a los lados.
5. **Velocidad:** lo que sea escribir, ×3–×4; desplazarse por una página, ×1,5–×2;
   lo que el espectador tiene que leer, ×1. Ajusta hasta que el clip dure lo que
   dice la columna «Seg.» del guion. Si sobra, corta; no aceleres más de ×4.
6. **Zoom (opcional):** si un elemento queda pequeño (una casilla, un botón), un
   acercamiento suave del 100 % al 120 % durante la escena lo destaca. Uno por
   reel como mucho: más, marea.

**Cada tarjeta:**

7. Las tarjetas son imágenes: ponles la **duración que dice el guion**. Una
   regla para comprobarlo: **léela en voz alta despacio y añade un segundo**. Si
   no te da tiempo, la duración es corta.

**Los rótulos:**

8. Para cada escena grabada con rótulo: «Superposición» › añade
   `escena-NN-rotulo.png`, **a pantalla completa** (que encaje con el lienzo), y
   alárgalo para que dure **exactamente lo mismo que su clip**.
9. Comprueba que el rótulo **no tapa lo que se está tocando**. Si lo tapa, sube
   o baja el **clip grabado**, no el rótulo.

**Transiciones:**

10. **Cortes secos** entre escenas. Si quieres suavizar, un fundido muy corto
    (0,2 s) solo al entrar y salir de las tarjetas. Nada de giros ni zooms de
    transición: distraen y hacen parecer el vídeo un anuncio.

**Sonido:**

11. **La música, mejor en Instagram al publicar** que en CapCut. Instagram te deja
    usar la de su biblioteca sin problemas de derechos; una canción metida desde
    otro sitio puede hacer que silencien el reel. Volumen bajo: el reel se tiene
    que entender sin él.
    Si la cuenta es de empresa o de creador, la biblioteca es más corta (solo
    música libre de derechos para uso comercial). Escoge algo instrumental y
    tranquilo.
12. **Voz (opcional):** si la pones, graba el bloque «Voz» del guion con el
    micrófono del móvil, en una habitación sin eco (con ropa o cortinas cerca),
    y ajusta los clips a la voz, no al revés. Con voz, añade los subtítulos
    automáticos de CapCut y **revísalos palabra a palabra**: «máster» y
    «pre-reserva» suelen salir mal.

**Exportar:**

13. **1080p, 30 fotogramas por segundo.** Más no se nota en Instagram y pesa
    más.
14. Antes de publicar, **mira el vídeo exportado de principio a fin en el
    móvil, sin sonido**. Si no se entiende sin sonido, falta texto o sobra
    velocidad.

## 5 · Publicar en Instagram (10 minutos)

1. Nuevo reel › elige el vídeo exportado.
2. **Música** (si la pones): de la biblioteca, volumen bajo.
3. **Portada:** «Editar portada» › «Añadir desde el carrete» › `00-portada.png`.
   Tiene el texto en el centro, para que la cuadrícula del perfil, que recorta,
   no lo corte.
4. **Texto de la publicación:** el del guion, copiado tal cual.
5. **Texto alternativo:** en la configuración avanzada, el «Texto alternativo»
   del guion.
6. Deja activado que **se comparta también en el feed**.
7. Publica y **contesta los comentarios de la primera hora**: es cuando Instagram
   decide a cuánta gente más se lo enseña.

## 6 · Después

- **Retira los datos de demostración** que diga el guion (`datos-demo.md`):
  «Retirar del portal» la devuelve a borrador.
- **En la web:** sube el vídeo, **sin música**, a YouTube como Short y enlázalo
  desde el artículo del blog que diga el guion (ver `docs/blog.md`: `@[video](…)`
  con el enlace de YouTube).
- Apunta en el guion la fecha de publicación y, a la semana, las
  reproducciones, los guardados y los clics al enlace de la bio. Lo que mejor
  funcione marca el siguiente reel.

## Errores frecuentes

| Se ve…                                | Es por…                                               | Arreglo                                          |
| ------------------------------------- | ----------------------------------------------------- | ------------------------------------------------ |
| El rótulo tapa el nombre de la cuenta | Se ha encogido o movido el rótulo                     | Ponlo a pantalla completa, sin moverlo           |
| Bandas negras arriba y abajo          | El clip no llena el lienzo                            | Amplía el clip hasta llenarlo                    |
| La hora o la batería en la esquina    | No se ha recortado la barra de estado                 | Sube el clip hasta que quede fuera               |
| La tarjeta pasa antes de poder leerla | Duración corta                                        | Léela en voz alta y suma un segundo              |
| Todo va a tirones                     | Grabado con ahorro de energía o desplazamiento brusco | Repite la toma con batería alta y gesto suave    |
| Instagram silencia el vídeo           | Música metida en el editor con derechos               | Quítala y ponla desde la biblioteca de Instagram |
