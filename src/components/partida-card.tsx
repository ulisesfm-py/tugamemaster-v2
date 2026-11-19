import Link from 'next/link';

import { Lamina } from '@/components/lamina';
import { Avatar, Fecha, Precio, Privada } from '@/components/ui';
import type {
  FrecuenciaConvocatoria,
  PlanGm,
  VisibilidadPartida,
} from '@/generated/prisma/enums';
import { describirDias, hora } from '@/modules/convocatorias/politica';
import { etiquetasDe, PLAZAS_POCAS, type Experiencia } from '@/modules/games/ficha';
import { cn } from '@/lib/utils';

/**
 * Las tarjetas de mesa: partida con fecha fija, mesa con fecha flexible y
 * sesion de campana.
 *
 * Es la pieza que mas se repite en toda la web —portada, listado, perfil de
 * GM— asi que las decisiones de aqui se ven en todas partes.
 *
 * **Los tres tipos comparten el mismo esqueleto**, hueco por hueco: lamina con
 * insignia, tipo y sistema, titulo, una linea de «cuando», etiquetas, game
 * master con el recuento de sillas, y precio con «Ver mesa» al pie. Solo
 * cambian la etiqueta del tipo, su color (una franja bajo la lamina y un tinte
 * leve del fondo) y lo que dicen la insignia y el «cuando». Una tarjeta con un
 * hueco de mas o un boton en otra altura se lee como otra cosa.
 *
 * Mas decisiones que vienen de antes:
 *
 * - **Las plazas se cuentan como urgencia y, aparte, como inventario.** La
 *   insignia de la lamina dice «Queda 1 plaza», que mueve a alguien; el pie
 *   anade «3/5» con un sillon para quien prefiere el recuento.
 * - **Hay lamina siempre.** Sin imagen del GM se compone una con el sistema.
 * - **«Abierta a todos» se ensena en la tarjeta**: es el dato que mas quita el
 *   miedo a quien nunca ha jugado.
 */

export type TipoDeMesa = 'fija' | 'flexible' | 'campana';

/** Lo que distingue a cada tipo a simple vista. */
const ESTILO: Record<
  TipoDeMesa,
  { etiqueta: string; texto: string; franja: string; fondo: string }
> = {
  fija: {
    etiqueta: 'Fecha fija',
    texto: 'text-primary',
    franja: 'bg-primary',
    fondo: 'bg-card',
  },
  flexible: {
    etiqueta: 'Fecha flexible',
    texto: 'text-flexible',
    franja: 'bg-flexible',
    fondo: 'bg-[color-mix(in_srgb,var(--flexible)_7%,var(--card))]',
  },
  campana: {
    etiqueta: 'Campaña',
    texto: 'text-campana',
    franja: 'bg-campana',
    fondo: 'bg-[color-mix(in_srgb,var(--campana)_7%,var(--card))]',
  },
};

type Gm = {
  /** Opcional: el muestrario de `/estilo` pinta tarjetas sin plan. */
  plan?: PlanGm;
  user: { name: string; slug: string; image: string | null };
};

type Reputacion = { valoracionMedia: number | null; totalResenas: number };

/** Lo que pinta la tarjeta, sea del tipo que sea. */
type Datos = {
  tipo: TipoDeMesa;
  /** Lo que acompana a la etiqueta del tipo, como «Sesión 3». */
  detalleDelTipo?: string;
  href: string;
  title: string;
  system: string;
  imageUrl: string | null;
  experience: Experiencia;
  tags: string[];
  /** La linea bajo el titulo: la fecha, o la franja de una mesa flexible. */
  cuando: React.ReactNode;
  insignia: { texto: string; urgente: boolean };
  /** Sillas para el recuento del pie: ocupadas (o pre-reservadas) y total. */
  ocupadas: number;
  total: number;
  /** Como se lee el recuento: «3 de 5 plazas ocupadas». */
  recuento: string;
  priceCents: number;
  currency: string;
  privada: boolean;
  gm: Gm;
  reputacion?: Reputacion;
};

function TarjetaDeMesa({ datos, className }: { datos: Datos; className?: string }) {
  const estilo = ESTILO[datos.tipo];

  // Dos como mucho: la tarjeta tiene que seguir leyendose de un vistazo.
  const etiquetas = etiquetasDe(datos.tags).slice(0, 2);

  return (
    <li className={cn('h-full', className)}>
      <Link
        href={datos.href}
        className={`group border-border ${estilo.fondo} hover:border-primary hover:shadow-primary/55 focus-visible:ring-ring focus-visible:ring-offset-background flex h-full flex-col overflow-hidden rounded-sm border transition hover:-translate-y-0.5 hover:shadow-[0_6px_26px_-10px] focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none`}
      >
        <div className="from-accent/20 to-background relative grid aspect-[16/9] place-items-center overflow-hidden bg-gradient-to-br">
          <Lamina
            src={datos.imageUrl}
            system={datos.system}
            sizes="(max-width: 640px) 90vw, 20rem"
          />

          <span
            className={`absolute top-2 left-2 rounded-full px-2.5 py-1 text-[11px] font-bold tracking-wide uppercase ${
              datos.insignia.urgente
                ? 'bg-primary text-primary-foreground'
                : 'bg-background/70 text-foreground backdrop-blur-sm'
            }`}
          >
            {datos.insignia.texto}
          </span>

          {datos.privada && (
            <Privada className="absolute top-2 right-2 backdrop-blur-sm" />
          )}
        </div>

        {/* La franja del tipo: la misma altura en todas, cambia solo el color. */}
        <span aria-hidden className={`h-1 w-full ${estilo.franja}`} />

        <div className="flex flex-1 flex-col gap-2 p-4">
          <span className="truncate text-[11px] font-semibold tracking-widest uppercase">
            <span className={estilo.texto}>
              {estilo.etiqueta}
              {datos.detalleDelTipo && ` · ${datos.detalleDelTipo}`}
            </span>
            <span className="text-muted-foreground"> · {datos.system}</span>
          </span>

          <h3 className="font-heading text-foreground text-base leading-snug font-bold text-balance">
            {datos.title}
          </h3>

          {/* Una sola linea en todas: una franja larga se corta antes que
              empujar el resto de la tarjeta hacia abajo. */}
          <p className="text-muted-foreground truncate text-sm">{datos.cuando}</p>

          {(datos.experience === 'ABIERTA' || etiquetas.length > 0) && (
            <p className="flex flex-wrap gap-1.5">
              {datos.experience === 'ABIERTA' && (
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
              src={datos.gm.user.image}
              nombre={datos.gm.user.name}
              tamano={20}
              fundador={datos.gm.plan === 'FUNDADOR'}
            />
            <span className="truncate">{datos.gm.user.name}</span>
            {/* En la tarjeta no cabe la etiqueta: el anillo basta a la vista,
                y esto se lo cuenta a quien la escucha. */}
            {datos.gm.plan === 'FUNDADOR' && (
              <span className="sr-only">, game master fundador</span>
            )}
            {datos.reputacion?.valoracionMedia !== null &&
              datos.reputacion !== undefined && (
                <span className="flex items-center gap-1">
                  <span aria-hidden className="text-accent">
                    ★
                  </span>
                  <span className="text-foreground font-semibold tabular-nums">
                    {datos.reputacion.valoracionMedia?.toFixed(1)}
                  </span>
                  <span className="sr-only">
                    de 5, con {datos.reputacion.totalResenas} reseñas
                  </span>
                </span>
              )}

            <span
              className="text-muted-foreground ml-auto flex shrink-0 items-center gap-1 text-sm tabular-nums"
              title={datos.recuento}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="size-4"
                aria-hidden
              >
                <path d="M19 9V6a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v3" />
                <path d="M3 16a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5a2 2 0 0 0-4 0v1.5a.5.5 0 0 1-.5.5h-9a.5.5 0 0 1-.5-.5V11a2 2 0 0 0-4 0z" />
                <path d="M5 18v2" />
                <path d="M19 18v2" />
              </svg>
              <span aria-hidden>
                {datos.ocupadas}/{datos.total}
              </span>
              <span className="sr-only">{datos.recuento}</span>
            </span>
          </div>

          <div className="border-border mt-auto flex items-baseline justify-between gap-2 border-t pt-3">
            <span className="font-heading text-foreground text-lg font-bold tabular-nums">
              <Precio cents={datos.priceCents} currency={datos.currency} />
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

/* ── Partida con fecha (fija o sesion de campana) ───────────────────────── */

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
  /** Opcional por la misma razon que el plan: el muestrario no la trae. */
  visibility?: VisibilidadPartida;
  /** Si continua otra partida, es una sesion de campana. */
  previousGameId?: string | null;
  sessionNumber?: number | null;
  gm: Gm;
  _count: { bookings: number };
  /** Reputacion del GM, si quien llama la ha consultado. */
  reputacion?: Reputacion;
};

/** Lo que se dice de las plazas, y con cuanta insistencia. */
function plazas(libres: number, total: number) {
  if (libres <= 0) return { texto: 'Completa', urgente: false };

  if (libres <= PLAZAS_POCAS) {
    return {
      texto: libres === 1 ? 'Queda 1 plaza' : `Quedan ${libres} plazas`,
      urgente: true,
    };
  }

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
  const ocupadas = partida._count.bookings;
  const campana = Boolean(partida.previousGameId);

  return (
    <TarjetaDeMesa
      className={className}
      datos={{
        tipo: campana ? 'campana' : 'fija',
        detalleDelTipo:
          campana && partida.sessionNumber
            ? `Sesión ${partida.sessionNumber}`
            : undefined,
        href: `/partidas/${partida.slug}`,
        title: partida.title,
        system: partida.system,
        imageUrl: partida.imageUrl,
        experience: partida.experience,
        tags: partida.tags,
        cuando: <Fecha valor={partida.startsAt} />,
        insignia: plazas(partida.seatsTotal - ocupadas, partida.seatsTotal),
        ocupadas,
        total: partida.seatsTotal,
        recuento: `${ocupadas} de ${partida.seatsTotal} plazas ocupadas`,
        priceCents: partida.priceCents,
        currency: partida.currency,
        privada: partida.visibility === 'PRIVADA',
        gm: partida.gm,
        reputacion: partida.reputacion,
      }}
    />
  );
}

/* ── Mesa con fecha flexible ─────────────────────────────────────────────── */

type MesaFlexible = {
  title: string;
  slug: string;
  system: string;
  imageUrl: string | null;
  experience: Experiencia;
  tags: string[];
  weekdays: number[];
  startMinute: number;
  durationMinutes: number;
  frequency: FrecuenciaConvocatoria;
  seatsTotal: number;
  minPlayers: number;
  priceCents: number;
  currency: string;
  gm: Gm;
  _count: { preReservas: number };
  reputacion?: Reputacion;
};

/** La insignia de una mesa flexible: cuanto falta para poder jugarla. */
function faltan(apuntados: number, minimo: number, total: number) {
  if (apuntados >= total) return { texto: 'Completa', urgente: false };

  const n = minimo - apuntados;
  if (n <= 0) return { texto: 'Mínimo alcanzado', urgente: false };

  return {
    texto: n === 1 ? 'Falta 1 para jugar' : `Faltan ${n} para jugar`,
    urgente: n === 1,
  };
}

export function MesaFlexibleCard({
  mesa,
  className,
}: {
  mesa: MesaFlexible;
  className?: string;
}) {
  const apuntados = mesa._count.preReservas;
  const fin = mesa.startMinute + mesa.durationMinutes;

  return (
    <TarjetaDeMesa
      className={className}
      datos={{
        tipo: 'flexible',
        href: `/mesas/${mesa.slug}`,
        title: mesa.title,
        system: mesa.system,
        imageUrl: mesa.imageUrl,
        experience: mesa.experience,
        tags: mesa.tags,
        // La version corta de la franja: la larga, con la frecuencia, esta en
        // la pagina de la mesa.
        cuando: `${describirDias(mesa.weekdays)} · ${hora(mesa.startMinute)}–${hora(fin)}`,
        insignia: faltan(apuntados, mesa.minPlayers, mesa.seatsTotal),
        ocupadas: apuntados,
        total: mesa.seatsTotal,
        recuento: `${apuntados} de ${mesa.seatsTotal} plazas pre-reservadas`,
        priceCents: mesa.priceCents,
        currency: mesa.currency,
        privada: false,
        gm: mesa.gm,
        reputacion: mesa.reputacion,
      }}
    />
  );
}
