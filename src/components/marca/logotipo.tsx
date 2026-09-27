import Image from 'next/image';

import { LOGOTIPO } from '@/lib/marca';
import { cn } from '@/lib/utils';

/**
 * El logotipo de la casa.
 *
 * Existe para que la cabecera y el pie no lo resuelvan cada uno a su manera: si
 * divergen se nota, porque es la misma marca dos veces en la misma pantalla.
 *
 * Sin imagen se escribe el nombre con la tipografía de títulos, que es lo que
 * había antes y sigue siendo un caso normal, no un hueco.
 */
export function Logotipo({
  tamano = 28,
  compacto,
  className,
}: {
  /** Alto del emblema en píxeles. El ancho sale de la proporción del fichero. */
  tamano?: number;
  /**
   * En pantalla estrecha se queda solo el emblema.
   *
   * Lo pide la cabecera: con el nombre escrito al lado, en un teléfono ya no
   * cabía el botón de crear cuenta y se salía de la pantalla.
   *
   * Se esconde a la vista, no del todo: `sr-only` mantiene el nombre en el
   * árbol de accesibilidad, así que quien escucha la página sigue oyendo a
   * dónde lleva el enlace.
   */
  compacto?: boolean;
  className?: string;
}) {
  const nombre = (
    <span
      className={cn(
        'font-heading text-base font-extrabold tracking-tight whitespace-nowrap sm:text-lg',
        compacto && 'sr-only sm:not-sr-only',
      )}
    >
      TuGameMaster
    </span>
  );

  if (!LOGOTIPO) return nombre;

  const ancho = Math.round((LOGOTIPO.ancho / LOGOTIPO.alto) * tamano);

  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <Image
        src={LOGOTIPO.src}
        // Decorativa cuando el nombre va al lado: leerlo dos veces solo añade
        // ruido a quien escucha la página. Si la imagen trae el nombre dentro,
        // entonces sí es ella quien lo dice.
        alt={LOGOTIPO.llevaNombre ? 'TuGameMaster' : ''}
        width={ancho}
        height={tamano}
        // La cabecera está en todas las pantallas: si carga tarde, baila.
        priority
      />
      {LOGOTIPO.llevaNombre ? null : nombre}
    </span>
  );
}
