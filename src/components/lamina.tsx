import Image from 'next/image';

import { cn } from '@/lib/utils';

/**
 * La imagen de una partida.
 *
 * La mayoria de partidas no tendran imagen al principio, asi que el caso sin
 * ella no es una excepcion: es el caso normal. En vez de dejar un rectangulo
 * gris, se compone una lamina con el sistema de juego en grande sobre el
 * degradado de la casa. Una parrilla de partidas sin imagen sigue teniendo
 * aspecto de catalogo.
 *
 * Va aqui y no repetida en cada pantalla porque la usan la tarjeta y la pagina
 * de la partida, y si divergen se nota: son la misma partida vista dos veces.
 */
export function Lamina({
  src,
  system,
  sizes,
  priority,
  claseTexto = 'text-xl',
}: {
  src: string | null;
  system: string;
  /** Anchura que ocupara la imagen, para que next/image sirva la talla justa. */
  sizes: string;
  priority?: boolean;
  claseTexto?: string;
}) {
  if (src) {
    return (
      <Image
        src={src}
        // Decorativa: el titulo de la partida esta al lado y describirla otra
        // vez solo anade ruido a quien escucha la pagina.
        alt=""
        fill
        sizes={sizes}
        priority={priority}
        className="object-cover"
      />
    );
  }

  return (
    <span
      className={cn(
        'font-heading text-foreground/55 px-4 text-center font-extrabold text-balance',
        claseTexto,
      )}
    >
      {system}
    </span>
  );
}
