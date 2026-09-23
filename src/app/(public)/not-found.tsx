import type { Metadata } from 'next';

import { NoEncontrado } from '@/components/no-encontrado';

export const metadata: Metadata = { title: 'Aquí no hay nada · TuGameMaster' };

/** Sin armazon: el layout de este grupo ya monta cabecera y pie. */
export default function NotFound() {
  return <NoEncontrado />;
}
