import type { Metadata } from 'next';

import { Cascaron } from '@/components/cascaron/cascaron';
import { NoEncontrado } from '@/components/no-encontrado';

export const metadata: Metadata = { title: 'Aquí no hay nada · TuGameMaster' };

/**
 * Una direccion que no encaja con ninguna ruta.
 *
 * Aqui no hay mas layout que el raiz, asi que el armazon lo pone esta pagina.
 * Las paginas que llaman a `notFound()` desde dentro de un grupo usan el
 * `not-found.tsx` de su grupo, que no lo pone porque su layout ya lo trae.
 */
export default function NotFound() {
  return (
    <Cascaron>
      <NoEncontrado />
    </Cascaron>
  );
}
