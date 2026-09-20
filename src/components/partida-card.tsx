import Link from 'next/link';

import { Lamina } from '@/components/lamina';
import { Avatar, Fecha, Precio } from '@/components/ui';
import { etiquetasDe, type Experiencia } from '@/modules/games/ficha';
import { cn } from '@/lib/utils';

/**
 * La tarjeta de partida.
 *
 * Es la pieza que mas se repite en toda la web —portada, listado, perfil de
 * GM— asi que las decisiones de aqui se ven en todas partes.
 *
 * Tres cosas que cambian respecto a la anterior:
 *
 * 1. **Las plazas se cuentan como urgencia, no como inventario.** «Queda 1
 *    plaza» y «2 de 6 ocupadas» dicen el mismo dato; el primero mueve a
 *    alguien y el segundo no.
 * 2. **La nota del game master va en la tarjeta.** Es lo que mas ayuda a
 *    elegir entre dos partidas parecidas, y antes habia que entrar para verla.
 * 3. **Hay lamina siempre.** Cuando el GM no sube imagen —que sera lo normal
 *    al principio— se compone una con el sistema de juego en grande, en vez de
 *    dejar un hueco gris.
 * 4. **«Abierta a todos» se ensena en la tarjeta.** De toda la ficha tecnica
 *    es el dato que mas gente descarta o elige de un vistazo, y el que mas
 *    miedo quita a quien nunca ha jugado.
 */

type Partida = {
  title: string;
  slug: string;
  system: string;
  imageUrl: string | null;
  experience: Experiencia;
  tags: string[];
  startsAt: Date;
  seatsTotal: number;
  priceCents: number;
  currency: string;
  gm: {
    user: { name: string; slug: string; image: string | null };
  };
  _count: { bookings: number };
  /** Reputacion del GM, si quien llama la ha consultado. */
  reputacion?: { valoracionMedia: number | null; totalResenas: number };
};

/** Lo que se dice de las plazas, y con cuanta insistencia. */
function plazas(libres: number, total: number) {
  if (libres <= 0) return { texto: 'Completa', urgente: false };
  if (libres === 1) return { texto: 'Queda 1 plaza', urgente: true };
  if (libres === 2) return { texto: 'Quedan 2 plazas', urgente: true };

  return { texto: `${libres} de ${total} plazas libres`, urgente: false };
}

export function PartidaCard({
  partida,
  className,
}: {
  partida: Partida;
  /** Se aplica al <li>: quien la coloca decide cuanto ocupa. */
  className?: string;
}) {
  const libres = partida.seatsTotal - partida._count.bookings;
  const aforo = plazas(libres, partida.seatsTotal);

  // Dos como mucho: la tarjeta tiene que seguir leyendose de un vistazo.
  const etiquetas = etiquetasDe(partida.tags).slice(0, 2);

  return (
    <li className={cn('h-full', className)}>
      <Link
        href={`/partidas/${partida.slug}`}
        className="group border-border bg-card hover:border-primary hover:shadow-primary/55 focus-visible:ring-ring focus-visible:ring-offset-background flex h-full flex-col overflow-hidden rounded-sm border transition hover:-translate-y-0.5 hover:shadow-[0_6px_26px_-10px] focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
      >
        <div className="from-accent/20 to-background relative grid aspect-[16/9] place-items-center overflow-hidden bg-gradient-to-br">
          <Lamina
            src={partida.imageUrl}
            system={partida.system}
            sizes="(max-width: 640px) 90vw, 20rem"
          />

          <span
            className={`absolute top-2 left-2 rounded-full px-2.5 py-1 text-[11px] font-bold tracking-wide uppercase ${
              aforo.urgente
                ? 'bg-primary text-primary-foreground'
                : 'bg-background/70 text-foreground backdrop-blur-sm'
            }`}
          >
            {aforo.texto}
          </span>
        </div>

        <div className="flex flex-1 flex-col gap-2 p-4">
          <span className="text-muted-foreground text-[11px] font-semibold tracking-widest uppercase">
            {partida.system}
          </span>

          <h3 className="font-heading text-foreground text-base leading-snug font-bold text-balance">
            {partida.title}
          </h3>

          <p className="text-muted-foreground text-sm">
            <Fecha valor={partida.startsAt} />
          </p>

          {(partida.experience === 'ABIERTA' || etiquetas.length > 0) && (
            <p className="flex flex-wrap gap-1.5">
              {partida.experience === 'ABIERTA' && (
                <span className="border-success/35 bg-success/10 text-success rounded-full border px-2 py-0.5 text-[11px] font-semibold">
                  Abierta a todos
                </span>
              )}
              {etiquetas.map((e) => (
                <span
                  key={e.id}
                  className="border-border text-muted-foreground rounded-full border px-2 py-0.5 text-[11px]"
                >
                  {e.texto}
                </span>
              ))}
            </p>
          )}

          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            <Avatar
              src={partida.gm.user.image}
              nombre={partida.gm.user.name}
              tamano={20}
            />
            {partida.gm.user.name}
            {partida.reputacion?.valoracionMedia !== null &&
              partida.reputacion !== undefined && (
                <span className="flex items-center gap-1">
                  <span aria-hidden className="text-accent">
                    ★
                  </span>
                  <span className="text-foreground font-semibold tabular-nums">
                    {partida.reputacion.valoracionMedia?.toFixed(1)}
                  </span>
                  <span className="sr-only">
                    de 5, con {partida.reputacion.totalResenas} reseñas
                  </span>
                </span>
              )}
          </div>

          <div className="border-border mt-auto flex items-baseline justify-between gap-2 border-t pt-3">
            <span className="font-heading text-foreground text-lg font-bold tabular-nums">
              <Precio cents={partida.priceCents} currency={partida.currency} />
              <span className="text-muted-foreground ml-1 text-xs font-medium">
                /plaza
              </span>
            </span>
            <span className="text-primary text-sm font-semibold group-hover:underline">
              Ver mesa
            </span>
          </div>
        </div>
      </Link>
    </li>
  );
}
