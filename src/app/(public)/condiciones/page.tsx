import type { Metadata } from 'next';

import { PORCENTAJE_DEVOLUCION, TEXTO_CONDICIONES } from '@/modules/bookings/politica';

export const metadata: Metadata = {
  title: 'Condiciones de reserva · TuGameMaster',
  description:
    `Cancelaciones, devoluciones y saldo. Devolución del ${PORCENTAJE_DEVOLUCION}% ` +
    'cancelando con antelación.',
};

export default function CondicionesPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
        Condiciones de reserva
      </h1>

      <section className="mt-8 space-y-4 text-slate-700 dark:text-slate-300">
        {TEXTO_CONDICIONES.detalle.map((parrafo) => (
          <p key={parrafo}>{parrafo}</p>
        ))}
      </section>

      <section className="mt-10 space-y-3 text-slate-700 dark:text-slate-300">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
          Cuándo cobra el game master
        </h2>
        <p>
          El dinero queda retenido por TuGameMaster y se transfiere al game master 48
          horas después de que termine la partida, siempre que no haya ninguna incidencia
          abierta. Esa espera es lo que permite atender una reclamación antes de que el
          dinero se haya movido.
        </p>
      </section>

      <section className="mt-10 space-y-3 text-slate-700 dark:text-slate-300">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
          Cómo reclamar
        </h2>
        <p>
          Desde <strong>Mis reservas</strong>, en cualquier partida ya jugada, puedes
          abrir una incidencia contando qué ocurrió. Mientras la revisamos, el pago al
          game master queda detenido.
        </p>
      </section>
    </main>
  );
}
