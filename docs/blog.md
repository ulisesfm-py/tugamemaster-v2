# Escribir un artículo del blog

Los artículos se escriben en **`/admin/blog/nuevo`**. El cuerpo no es HTML ni
Markdown: es un marcado pequeño que la web convierte en títulos, listas,
recuadros, imágenes y vídeos. Debajo del cuadro de texto del editor hay una
chuleta desplegable con lo mismo que aquí.

## El formato

```
## Título de sección
### Subtítulo

Un párrafo con **negrita** y un [enlace a la web](/partidas).
Un salto de línea simple se respeta.

- Elemento de lista
- Otro elemento

1. Primer paso
2. Segundo paso

> Consejo: un recuadro destacado (también Nota: y Ojo:)

---

![Texto alternativo](/blog/guia/reservar.webp "Pie de foto opcional")

@[video](https://youtu.be/XXXXXXXXXXX "Pie opcional")
@[video](/blog/guia/reservar.mp4)
```

- Los **títulos** (`##`, `###`) generan un ancla: `## Si juegas` se puede enlazar
  con `[ir a jugadores](#si-juegas)`. Con un `#` o con cuatro no son títulos: el
  título del artículo ya es el nivel 1.
- Una **lista** son líneas seguidas que empiezan por `-` o por `1.`.
- Un **recuadro** son líneas seguidas que empiezan por `>`. Si la primera dice
  `Consejo:`, `Nota:` u `Ojo:`, el recuadro toma ese color y esa etiqueta.
- Una **imagen** o un **vídeo** va solo en su línea.
- El HTML no se interpreta: `<b>hola</b>` se ve tal cual.

Si algo no es válido (una imagen de otro sitio, un enlace raro), **al guardar
sale un error con el número de línea** y el artículo no se guarda.

## Imágenes

Van en **`public/blog/`** del proyecto, igual que el logo: viajan con el código y
no hay que subirlas a ningún sitio. Se referencian como `/blog/nombre.webp`.

- **Nombre**: en minúsculas, con letras, números, `-`, `_` y `/` para
  subcarpetas. **Sin más puntos** que el de la extensión (`reservar-paso-2.webp`,
  no `reservar.v2.webp`).
- **Formato**: `.webp` (mejor), `.jpg`, `.png` o `.gif`. SVG no.
- **Tamaño**: 1600 px de ancho, proporción 16:9 si puedes. Se muestran a 768 px
  como máximo, y Next las reduce y las convierte solo.
- **Peso**: procura que cada una pase de poco los 300 KB. Una captura en `.webp`
  de calidad 80 suele quedarse en 100–200 KB.
- Escribe siempre el **texto alternativo**: es lo que lee un lector de pantalla
  y lo que se ve si la imagen no carga.

También valen imágenes del almacén Blob que cuelguen de `/blog/` (las portadas
que se suben desde el editor viven ahí).

## Vídeos

Hay dos tipos y se escriben igual, con `@[video](...)`:

**Clips propios** (`.mp4` o `.webm`), pensados para capturas de pantalla de 10 a
20 segundos que enseñan un paso: reservar, crear una partida, abrir una
incidencia. Van en `public/blog/` y se reproducen con los controles normales.

- Procura que cada uno pese **menos de 5 MB**: sin sonido, 1280 px de ancho o
  menos, MP4 en H.264 o WebM.
- No se descargan hasta que alguien pulsa (`preload="metadata"`), así que no
  pesan en la carga de la página.

**YouTube**, para vídeos largos. Vale cualquier enlace normal (`youtube.com/watch`,
`youtu.be`, `/shorts/`, `/embed/`). La página muestra una tarjeta con un botón de
play y **no carga nada de YouTube hasta que el lector lo pulsa**; entonces monta
el reproductor del dominio `youtube-nocookie.com`. Por eso no hace falta aviso de
cookies al entrar. Está descrito en `/privacidad`.

Cualquier otro origen de vídeo (Vimeo, un `.mp4` de otra web) se rechaza al
guardar.

## Mientras no hay artículos

`/estilo` (solo en desarrollo, da 404 en producción) enseña un artículo de
muestra con todos los elementos. Es la forma de ver cómo queda un cambio de
estilo sin escribir nada en la base de datos. Usa `public/blog/ejemplo-captura.png`
como imagen de prueba.
