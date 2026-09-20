import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import {
  Aviso,
  EnlaceBoton,
  Estado,
  ESTADO_DE_PARTIDA,
  Fecha,
  Precio,
  Vacio,
} from '@/components/ui';
import { auth } from '@/lib/auth';
import { estadoVisible, type EstadoDePartida } from '@/modules/games/ficha';
import { misPartidas } from '@/modules/games/queries';

export const metadata: Metadata = { title: 'Mis partidas · TuGameMaster' };

/** Una partida de la consulta, con el estado que se le ensena al GM. */
type Datos = NonNullable<Awaited<ReturnType<typeof misPartidas>>>;
type Partida = Datos['partidas'][number] & { visible: EstadoDePartida };

/** Una mesa en la lista del game master. */
function Fila({ partida }: { partida: Partida }) {
  const estado = ESTADO_DE_PARTIDA[partida.visible];
  const libres = partida.seatsTotal - partida._count.bookings;

  return (
    <li>
      <Link
        href={`/cuenta/partidas/${partida.id}`}
        className="border-border bg-card hover:border-primary focus-visible:ring-ring focus-visible:ring-offset-background block rounded-sm border p-4 transition focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
      >
        <div className="flex flex-wrap items-start gap-x-3 gap-y-2">
          <div className="min-w-0 flex-1">
            <h3 className="font-heading text-foreground font-bold">{partida.title}</h3>
            <p className="text-muted-foreground mt-0.5 text-sm">
              {partida.system} · <Fecha valor={partida.startsAt} />
            </p>
          </div>

          <Estado tono={estado.tono}>{estado.texto}</Estado>
        </div>

        <p className="text-muted-foreground mt-3 text-sm">
          <span className="text-foreground font-medium tabular-nums">
            <Precio cents={partida.priceCents} currency={partida.currency} />
          </span>{' '}
          por plaza ·{' '}
          <span
            className={
              partida.visible === 'PUBLISHED' && libres <= 0 ? 'text-success' : undefined
            }
          >
            {partida._count.bookings} de {partida.seatsTotal} ocupadas
          </span>
        </p>
      </Link>
    </li>
  );
}

/** Un bloque de la lista. No se pinta si no tiene nada dentro. */
function Grupo({ titulo, partidas }: { titulo: string; partidas: Partida[] }) {
  if (partidas.length === 0) return null;

  return (
    <section className="mt-8">
      <h2 className="font-heading text-foreground text-xl font-bold">{titulo}</h2>
      <ul className="mt-4 flex flex-col gap-3">
        {partidas.map((p) => (
          <Fila key={p.id} partida={p} />
        ))}
      </ul>
    </section>
  );
}

export default async function MisPartidasPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const datos = await misPartidas(session.user.id);
  if (!datos) redirect('/cuenta/gm');

  // El estado que se ensena se deduce: una publicada cuya hora ya paso esta
  // jugada, la cierre el cron esta noche o la que viene.
  const partidas = datos.partidas.map((p) => ({
    ...p,
    visible: estadoVisible(p.status, p.startsAt),
  }));

  // Tres grupos, porque son tres cosas distintas que hacer: las abiertas se
  // vigilan, los borradores se terminan y las pasadas se cierran —nota de
  // sesion, continuacion—. Una sola lista por fecha lo mezclaba todo.
  const abiertas = partidas.filter((p) => p.visible === 'PUBLISHED');
  const borradores = partidas.filter((p) => p.visible === 'DRAFT');
  const pasadas = partidas.filter(
    (p) => p.visible === 'COMPLETED' || p.visible === 'CANCELLED',
  );

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-foreground text-3xl font-extrabold sm:text-4xl">
            Mis partidas
          </h1>
          <p className="text-muted-foreground mt-2">Las mesas que diriges.</p>
        </div>

        <EnlaceBoton href="/cuenta/partidas/nueva">Nueva partida</EnlaceBoton>
      </div>

      {!datos.gm.payoutsEnabled && (
        <Aviso tono="atencion" className="mt-6" titulo="Todavía no puedes publicar">
          Puedes crear y preparar partidas, pero no publicarlas hasta configurar la cuenta
          donde recibir los pagos.{' '}
          <Link href="/cuenta/cobros" className="font-medium underline">
            Configurarla ahora
          </Link>
        </Aviso>
      )}

      {partidas.length === 0 ? (
        <Vacio
          className="mt-8"
          titulo="Todavía no has creado ninguna partida"
          accion={
            <EnlaceBoton href="/cuenta/partidas/nueva">Crear la primera</EnlaceBoton>
          }
        >
          Nace como borrador: podrás revisarla entera antes de que la vea nadie.
        </Vacio>
      ) : (
        <>
          <Grupo titulo="Abiertas" partidas={abiertas} />
          <Grupo titulo="Borradores" partidas={borradores} />
          <Grupo titulo="Ya jugadas" partidas={pasadas} />
        </>
      )}
    </main>
  );
}
