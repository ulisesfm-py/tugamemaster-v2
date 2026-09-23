import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { PartidaCard } from '@/components/partida-card';
import { Avatar, EnlaceBoton, Vacio } from '@/components/ui';
import {
  HORAS_CANCELACION_CON_DEVOLUCION,
  PORCENTAJE_DEVOLUCION,
} from '@/modules/bookings/politica';
import { sistemaPorSlug } from '@/modules/games/queries';

type Props = { params: Promise<{ nombre: string }> };

/**
 * La pagina de un sistema de juego.
 *
 * Existe sobre todo para quien busca «partidas de Vaesen» en un buscador y no
 * conoce la web: aterriza aqui y encuentra mesas abiertas, quien las dirige y
 * la garantia, sin tener que entender antes como funciona esto.
 */

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { nombre } = await params;
  const datos = await sistemaPorSlug(nombre);

  if (!datos) return { title: 'Sistema no encontrado · TuGameMaster' };

  const cuantas = datos.partidas.length;

  return {
    title: `Partidas de ${datos.sistema.nombre} · TuGameMaster`,
    description:
      cuantas === 0
        ? `Mesas de ${datos.sistema.nombre} dirigidas por game masters, en español.`
        : `${cuantas} ${cuantas === 1 ? 'mesa abierta' : 'mesas abiertas'} de ${datos.sistema.nombre}, con plaza pagada y garantizada.`,
  };
}

export default async function SistemaPage({ params }: Props) {
  const { nombre } = await params;
  const datos = await sistemaPorSlug(nombre);

  // Una direccion inventada da 404, no una pagina en blanco que finge ser un
  // sistema real.
  if (!datos) notFound();

  const { sistema, partidas, gms } = datos;

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <p className="text-accent text-sm font-semibold">Sistema de juego</p>

      <h1 className="font-heading text-foreground mt-2 text-3xl font-extrabold text-balance sm:text-4xl">
        Partidas de {sistema.nombre}
      </h1>

      <p className="text-muted-foreground mt-2">
        {partidas.length === 0
          ? 'Ahora mismo no hay ninguna mesa abierta de este sistema.'
          : `${partidas.length === 1 ? '1 mesa abierta, dirigida' : `${partidas.length} mesas abiertas, dirigidas`} por ${
              gms.length === 1 ? 'un game master' : `${gms.length} game masters`
            }.`}
      </p>

      {partidas.length === 0 ? (
        <Vacio
          className="mt-8"
          titulo="Todavía nadie dirige esto por aquí"
          accion={<EnlaceBoton href="/partidas">Ver todas las mesas</EnlaceBoton>}
        >
          Si lo diriges tú, esta página es tuya: abre una mesa y aparecerá aquí.
        </Vacio>
      ) : (
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {partidas.map((p) => (
            <PartidaCard key={p.id} partida={p} />
          ))}
        </ul>
      )}

      {gms.length > 0 && (
        <section className="mt-12">
          <h2 className="font-heading text-foreground text-xl font-bold">
            Quién lo dirige
          </h2>

          <ul className="mt-4 flex flex-wrap gap-3">
            {gms.map((gm) => (
              <li key={gm.id}>
                <Link
                  href={`/gm/${gm.user.slug}`}
                  className="border-border bg-card hover:border-primary focus-visible:ring-ring focus-visible:ring-offset-background flex items-center gap-2.5 rounded-full border py-1.5 pr-4 pl-1.5 text-sm transition focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                >
                  <Avatar src={gm.user.image} nombre={gm.user.name} tamano={28} />
                  <span className="text-foreground font-medium">{gm.user.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Quien llega desde un buscador no sabe nada de la web: aqui es donde
          hay que contarle por que su dinero esta a salvo. Los numeros salen de
          politica.ts, como en todas partes. */}
      <section className="border-border mt-12 rounded-sm border border-dashed p-5">
        <h2 className="font-heading text-foreground text-base font-bold">
          Reservar aquí te protege
        </h2>
        <p className="text-muted-foreground mt-2 text-sm">
          Pagas tu plaza al reservar y el dinero queda retenido hasta después de jugar. Si
          cancelas con más de {HORAS_CANCELACION_CON_DEVOLUCION} horas de antelación
          recuperas el {PORCENTAJE_DEVOLUCION}% en saldo, y si el game master no aparece,
          todo.
        </p>
        <div className="mt-4">
          <EnlaceBoton href="/como-funciona" variante="perfil" tamano="sm">
            Cómo funciona
          </EnlaceBoton>
        </div>
      </section>
    </main>
  );
}
