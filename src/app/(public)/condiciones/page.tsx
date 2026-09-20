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
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="font-heading text-foreground text-3xl font-extrabold">
        Condiciones de reserva
      </h1>
      <p className="text-muted-foreground mt-2">
        Lo que pasa con tu dinero si algo sale mal. Es corto a propósito.
      </p>

      <section className="text-muted-foreground mt-8 flex flex-col gap-4 leading-relaxed">
        {TEXTO_CONDICIONES.detalle.map((parrafo) => (
          <p key={parrafo}>{parrafo}</p>
        ))}
      </section>

      <section className="text-muted-foreground mt-10 flex flex-col gap-3 leading-relaxed">
        <h2 className="font-heading text-foreground text-xl font-bold">
          Cuándo cobra el game master
        </h2>
        <p>
          El dinero queda retenido por TuGameMaster y se transfiere al game master 48
          horas después de que termine la partida, siempre que no haya ninguna incidencia
          abierta. Esa espera es lo que permite atender una reclamación antes de que el
          dinero se haya movido.
        </p>
      </section>

      <section className="text-muted-foreground mt-10 flex flex-col gap-3 leading-relaxed">
        <h2 className="font-heading text-foreground text-xl font-bold">Cómo reclamar</h2>
        <p>
          Desde <strong className="text-foreground">Mis reservas</strong>, en cualquier
          partida ya jugada, puedes abrir una incidencia contando qué ocurrió. Mientras la
          revisamos, el pago al game master queda detenido.
        </p>
      </section>
    </main>
  );
}
