import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import {
  Avatar,
  Aviso,
  Estado,
  ESTADO_DE_PARTIDA,
  Fecha,
  Precio,
  Vacio,
} from '@/components/ui';
import { campanaPublica } from '@/modules/campaigns/queries';
import { estadoVisible } from '@/modules/games/ficha';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const campana = await campanaPublica(slug);

  if (!campana) return { title: 'Campaña no encontrada · TuGameMaster' };

  return {
    title: `${campana.title} · TuGameMaster`,
    description: campana.summary ?? undefined,
  };
}

export default async function CampanaPage({ params }: Props) {
  const { slug } = await params;
  const campana = await campanaPublica(slug);

  if (!campana) notFound();

  // El estado que se ensena se deduce: una sesion publicada cuya fecha ya paso
  // esta jugada, la cierre el cron esta noche o la que viene.
  const sesiones = campana.games.map((s) => ({
    ...s,
    visible: estadoVisible(s.status, s.startsAt),
  }));

  const jugadas = sesiones.filter((s) => s.visible === 'COMPLETED').length;
  const abierta = sesiones.find((s) => s.visible === 'PUBLISHED');

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <p className="text-accent text-sm font-semibold">Campaña</p>

      <h1 className="font-heading text-foreground mt-2 text-3xl font-extrabold text-balance sm:text-4xl">
        {campana.title}
      </h1>

      <p className="text-muted-foreground mt-2 text-sm">
        {sesiones.length === 1 ? '1 sesión' : `${sesiones.length} sesiones`}
        {jugadas > 0 && ` · ${jugadas} ya ${jugadas === 1 ? 'jugada' : 'jugadas'}`}
      </p>

      {campana.summary && (
        <p className="text-muted-foreground mt-6 leading-relaxed whitespace-pre-line">
          {campana.summary}
        </p>
      )}

      <Link
        href={`/gm/${campana.gm.user.slug}`}
        className="border-border bg-card hover:border-primary focus-visible:ring-ring focus-visible:ring-offset-background mt-8 flex items-center gap-3 rounded-sm border p-4 transition focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
      >
        <Avatar src={campana.gm.user.image} nombre={campana.gm.user.name} tamano={44} />
        <span className="min-w-0">
          <span className="text-muted-foreground block text-xs">La dirige</span>
          <span className="font-heading text-foreground block font-bold">
            {campana.gm.user.name}
          </span>
          {campana.gm.headline && (
            <span className="text-muted-foreground block text-sm">
              {campana.gm.headline}
            </span>
          )}
        </span>
      </Link>

      <section className="mt-10">
        <h2 className="font-heading text-foreground text-xl font-bold">Sesiones</h2>

        {sesiones.length === 0 ? (
          <Vacio className="mt-4" titulo="Todavía no hay sesiones publicadas">
            Cuando el game master publique la primera, aparecerá aquí.
          </Vacio>
        ) : (
          <ol className="mt-4 flex flex-col gap-3">
            {sesiones.map((sesion) => {
              const libres = sesion.seatsTotal - sesion._count.bookings;
              const estado = ESTADO_DE_PARTIDA[sesion.visible];

              return (
                <li
                  key={sesion.id}
                  className="border-border bg-card rounded-sm border p-4"
                >
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    {sesion.sessionNumber && (
                      <span className="text-muted-foreground text-xs font-semibold tracking-widest uppercase">
                        Sesión {sesion.sessionNumber}
                      </span>
                    )}

                    <Link
                      href={`/partidas/${sesion.slug}`}
                      className="font-heading text-foreground font-bold hover:underline"
                    >
                      {sesion.title}
                    </Link>

                    <Estado tono={estado.tono} className="ml-auto">
                      {estado.texto}
                    </Estado>
                  </div>

                  <p className="text-muted-foreground mt-1.5 text-sm">
                    {sesion.system} · <Fecha valor={sesion.startsAt} />
                  </p>

                  {sesion.visible === 'PUBLISHED' && (
                    <p className="text-foreground mt-2 text-sm">
                      <Precio cents={sesion.priceCents} currency={sesion.currency} /> por
                      plaza ·{' '}
                      <span className={libres > 0 ? '' : 'text-muted-foreground'}>
                        {libres > 0 ? `${libres} libres` : 'completa'}
                      </span>
                      {sesion.previousGameId && (
                        <span className="text-muted-foreground">
                          {' '}
                          · solo para quienes jugaron la anterior
                        </span>
                      )}
                    </p>
                  )}
                </li>
              );
            })}
          </ol>
        )}
      </section>

      {/* La regla que define una campana, explicada donde importa: aqui es
          donde alguien decide si se mete o no. */}
      <Aviso tono="dato" className="mt-8" titulo="Cómo funciona una campaña">
        Cada sesión nueva está reservada a quienes jugaron la anterior: tu plaza en la
        mesa se mantiene mientras sigas viniendo. No hay suscripción ni compromiso de
        meses; cada sesión se paga por separado.
        {!abierta && sesiones.length > 0 && (
          <> Ahora mismo no hay ninguna sesión abierta.</>
        )}
      </Aviso>
    </main>
  );
}
