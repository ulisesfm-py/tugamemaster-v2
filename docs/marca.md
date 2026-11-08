# Cambiar el logotipo y la lámina de la portada

Las imágenes de la marca viven en **`public/marca/`** y no se suben a ningún
sitio: viajan con el código. Para cambiar una, **sustituye el fichero
conservando el nombre**. No hay que tocar código.

| Qué                  | Fichero                    | Dónde se ve                            |
| -------------------- | -------------------------- | -------------------------------------- |
| Logotipo             | `public/marca/logo.svg`    | Cabecera y pie, en todas las páginas   |
| Lámina de la portada | `public/marca/portada.png` | Detrás del titular de la portada       |
| Icono de la pestaña  | `src/app/icon.svg`         | La pestaña del navegador y el marcador |

En desarrollo el cambio se ve al recargar. En producción, con el siguiente
despliegue.

## El logotipo

De serie es un emblema cuadrado —un d20— que acompaña al nombre escrito con la
tipografía de la casa.

- **Formato**: SVG mejor que PNG; se ve nítido en cualquier pantalla y pesa
  menos. Si usas PNG, que tenga al menos 128 px de alto y fondo transparente.
- **Colores**: el emblema se sirve como fichero, así que lleva sus colores
  dentro. Los de la casa son `#e2622a` (naranja brasa) y `#17120e` (el fondo).
  Ten en cuenta que se ve sobre fondo oscuro.
- **Proporción**: si no es cuadrado, abre `src/lib/marca.ts` y pon el ancho y
  el alto reales del fichero. Es lo único que hace falta para que no baile nada
  mientras carga.

Si tu logotipo **ya trae el nombre escrito dentro**, marca `llevaNombre: true`
en `src/lib/marca.ts` para que no se repita al lado:

```ts
export const LOGOTIPO: Logotipo | null = {
  src: '/marca/logo.svg',
  ancho: 160,
  alto: 32,
  llevaNombre: true,
};
```

En pantalla estrecha se queda solo el emblema: con el nombre al lado no cabía
el botón de crear cuenta.

## La lámina de la portada

La que hay es **un provisional que hice yo**: luz de brasa con los colores de la
paleta. Está para que la portada se vea terminada y para poder juzgar el
contraste del titular sobre una imagen de verdad. Sustitúyela en cuanto tengas
arte.

- **Tamaño**: 2000 px de ancho o más. Se pinta a sangre y recortada, así que lo
  que esté en los bordes puede no verse.
- **Formato**: `.jpg` para fotos, `.webp` si quieres afinar el peso. Si cambias
  de formato, cambia también la línea de `src/lib/marca.ts`:

  ```ts
  export const PORTADA: Portada | null = { src: '/marca/portada.jpg' };
  ```

- **Qué foto funciona**: una oscura, o con la parte izquierda despejada. El
  titular va encima con un velo oscuro que lo protege, pero una foto muy clara
  y muy cargada de detalle en la izquierda seguirá peleándose con el texto.
- **Encuadre**: si lo que importa queda arriba o abajo, ajusta `posicion` con la
  sintaxis de `object-position`:

  ```ts
  export const PORTADA: Portada | null = {
    src: '/marca/portada.jpg',
    posicion: 'center 25%',
  };
  ```

## Quitar una de las dos

Pon `null` en `src/lib/marca.ts` y la web sigue entera: sin logotipo se escribe
el nombre, y sin lámina la portada usa el degradado de la casa.

```ts
export const PORTADA: Portada | null = null;
```

## Lo que no hay que hacer

- **No subirlas al Blob de Vercel.** Ahí van las imágenes de los usuarios
  —avatares, láminas de partida, portadas del blog—, que cambian solas y no son
  nuestras. La marca cambia una vez al año y conviene tenerla versionada junto
  al código.
- **No enlazar una imagen de fuera.** `next.config.ts` solo permite los orígenes
  que usamos a propósito, y una imagen de otro dominio no se pintará.
- **No dejar dos guiones seguidos dentro de un comentario de un SVG.** Invalida
  el fichero entero y el navegador no pinta nada. Pasó con este logotipo.
