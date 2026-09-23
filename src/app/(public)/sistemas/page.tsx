import type { Metadata } from 'next';
import Link from 'next/link';

import { EnlaceBoton, Vacio } from '@/components/ui';
import { catalogoDeSistemas } from '@/modules/games/queries';

export const metadata: Metadata = {
  title: 'Sistemas de juego · TuGameMaster',
  description: 'Qué se juega en TuGameMaster, con las mesas abiertas de cada sistema.',
};

/**
 * El indice de sistemas.
 *
 * Existe para que las paginas de cada sistema tengan de donde colgar: sin el,
 * solo se llegaria a ellas desde un buscador o desde la etiqueta de una
 * tarjeta, y no habria manera de ver de un vistazo que se juega aqui.
 */
export default async function SistemasPage() {
  const sistemas = await catalogoDeSistemas();

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="font-heading text-foreground text-3xl font-extrabold sm:text-4xl">
        Qué se juega aquí
      </h1>
      <p className="text-muted-foreground mt-2">
        Los sistemas con mesa abierta ahora mismo. Los escribe cada game master, así que
        la lista cambia con lo que se publica.
      </p>

      {sistemas.length === 0 ? (
        <Vacio
          className="mt-8"
          titulo="No hay ninguna mesa abierta"
          accion={<EnlaceBoton href="/gm">Ver game masters</EnlaceBoton>}
        >
          Cuando alguien publique una partida, su sistema aparecerá en esta lista.
        </Vacio>
      ) : (
        <ul className="mt-8 grid gap-3 sm:grid-cols-2">
          {sistemas.map((s) => (
            <li key={s.slug}>
              <Link
                href={`/sistemas/${s.slug}`}
                className="border-border bg-card hover:border-primary focus-visible:ring-ring focus-visible:ring-offset-background flex items-baseline justify-between gap-3 rounded-sm border p-4 transition focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
              >
                <span className="font-heading text-foreground font-bold">{s.nombre}</span>
                <span className="text-muted-foreground text-sm whitespace-nowrap">
                  {s.partidas === 1 ? '1 mesa' : `${s.partidas} mesas`}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
