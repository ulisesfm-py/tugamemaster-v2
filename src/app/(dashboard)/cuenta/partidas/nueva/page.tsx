import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { ConvocatoriaForm } from '@/components/convocatoria-form';
import { PartidaForm } from '@/components/partida-form';
import { EnlaceBoton, Fecha, Vacio } from '@/components/ui';
import { auth } from '@/lib/auth';
import { DIAS_PARA_CONTINUAR_DESDE_LA_LISTA } from '@/modules/campaigns/politica';
import { crearConvocatoriaAction } from '@/modules/convocatorias/actions';
import { sesionesParaContinuar } from '@/modules/convocatorias/queries';
import { crearPartidaAction } from '@/modules/games/actions';
import { miPerfil } from '@/modules/profiles/queries';

export const metadata: Metadata = { title: 'Nueva partida · TuGameMaster' };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const TIPOS = [
  {
    id: 'fija',
    titulo: 'Fecha fija',
    texto: 'Pones día y hora, y la gente reserva y paga su plaza.',
  },
  {
    id: 'flexible',
    titulo: 'Fecha flexible',
    texto: 'Propones una franja. Cuando haya bastante gente, fijas la fecha.',
  },
  {
    id: 'campana',
    titulo: 'Continuar campaña',
    texto: 'La siguiente sesión de una partida que ya habéis jugado.',
  },
] as const;

type Tipo = (typeof TIPOS)[number]['id'];

function tipoDe(valor: string | string[] | undefined): Tipo {
  return TIPOS.some((t) => t.id === valor) ? (valor as Tipo) : 'fija';
}

/**
 * El selector de arriba.
 *
 * Son enlaces y no botones de un formulario: cada tipo es su propia direccion
 * (`?tipo=flexible`), funciona sin JavaScript y se puede compartir o volver
 * atras. Las tres tarjetas miden lo mismo para que ninguna parezca la buena.
 */
function Selector({ actual }: { actual: Tipo }) {
  return (
    <nav aria-label="Qué quieres crear" className="mt-8">
      <ul className="grid gap-3 sm:grid-cols-3">
        {TIPOS.map((t) => {
          const elegido = t.id === actual;
          return (
            <li key={t.id} className="flex">
              <Link
                href={`/cuenta/partidas/nueva?tipo=${t.id}`}
                aria-current={elegido ? 'page' : undefined}
                className={`focus-visible:ring-ring focus-visible:ring-offset-background flex w-full flex-col rounded-sm border p-4 transition focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none ${
                  elegido
                    ? 'border-primary bg-primary/8'
                    : 'border-border bg-card hover:border-muted-foreground'
                }`}
              >
                <span className="text-foreground font-semibold">{t.titulo}</span>
                <span className="text-muted-foreground mt-1 text-sm">{t.texto}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export default async function NuevaPartidaPage({ searchParams }: Props) {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const perfil = await miPerfil(session.user.id);

  // Sin perfil de GM no hay nada que hacer aquí: se envía a crearlo primero.
  if (!perfil?.gmProfile) redirect('/cuenta/gm');

  const tipo = tipoDe((await searchParams).tipo);
  const sesiones = tipo === 'campana' ? await sesionesParaContinuar(session.user.id) : [];

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <Link
        href="/cuenta/partidas"
        className="text-muted-foreground text-sm hover:underline"
      >
        ← Mis partidas
      </Link>

      <h1 className="font-heading text-foreground mt-4 text-3xl font-extrabold">
        Nueva partida
      </h1>

      <Selector actual={tipo} />

      {tipo === 'fija' && (
        <section className="mt-8">
          <p className="text-muted-foreground">
            Nace como borrador: podrás revisarla entera antes de que la vea nadie.
          </p>
          <div className="mt-6">
            <PartidaForm
              accion={crearPartidaAction}
              textoBoton="Crear borrador"
              idiomasPorDefecto={perfil.gmProfile.languages}
            />
          </div>
        </section>
      )}

      {tipo === 'flexible' && (
        <section className="mt-8">
          <p className="text-muted-foreground">
            La gente se pre-reserva sin pagar nada. Cuando llegues al mínimo, fijas la
            fecha y tienen unos días para reservar y pagar su plaza. Nace como borrador.
          </p>
          <div className="mt-6">
            <ConvocatoriaForm
              accion={crearConvocatoriaAction}
              textoBoton="Crear borrador"
              idiomasPorDefecto={perfil.gmProfile.languages}
            />
          </div>
        </section>
      )}

      {tipo === 'campana' && (
        <section className="mt-8">
          <p className="text-muted-foreground">
            Elige la sesión que quieres continuar. La siguiente solo la podrán reservar
            quienes la jugaron.
          </p>

          {sesiones.length === 0 ? (
            <Vacio className="mt-6" titulo="No hay sesiones recientes para continuar">
              {`Aquí salen las partidas que has jugado en los últimos ${DIAS_PARA_CONTINUAR_DESDE_LA_LISTA} días y que aún no tienen continuación. Las más antiguas se continúan desde su propia ficha.`}
            </Vacio>
          ) : (
            <ul className="mt-6 flex flex-col gap-3">
              {sesiones.map((s) => (
                <li
                  key={s.id}
                  className="border-border bg-card flex flex-wrap items-center gap-4 rounded-sm border p-4"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-heading text-foreground font-bold">{s.title}</p>
                    <p className="text-muted-foreground mt-0.5 text-sm">
                      {s.system} · <Fecha valor={s.startsAt} /> ·{' '}
                      {s._count.bookings === 1
                        ? '1 jugador'
                        : `${s._count.bookings} jugadores`}
                    </p>
                  </div>
                  <EnlaceBoton
                    href={`/cuenta/partidas/${s.id}/continuacion`}
                    variante="perfil"
                    tamano="sm"
                  >
                    Crear la siguiente sesión
                  </EnlaceBoton>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </main>
  );
}
