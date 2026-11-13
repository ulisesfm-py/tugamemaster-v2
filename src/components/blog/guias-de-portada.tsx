import Image from 'next/image';
import Link from 'next/link';

import { cn } from '@/lib/utils';
import { minutosDeLectura, resumenDe } from '@/modules/blog/politica';

/**
 * Seccion de guias de la portada.
 *
 * Misma fila deslizable que las partidas en movil (se ven varias tarjetas a la
 * vez y ninguna se esconde) y cuadricula de hasta tres columnas desde pantalla
 * mediana. Cada tarjeta es un enlace entero: portada, tiempo de lectura,
 * titulo y dos lineas de resumen.
 *
 * Si no hay ningun articulo publicado no se pinta nada: una seccion vacia en la
 * portada es peor que ninguna.
 */

export type GuiaDePortada = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string;
  coverUrl: string | null;
};

function Tarjeta({ guia, className }: { guia: GuiaDePortada; className?: string }) {
  const minutos = minutosDeLectura(guia.content);

  return (
    <li className={className}>
      <Link
        href={`/blog/${guia.slug}`}
        className="group border-border bg-card hover:border-primary focus-visible:ring-ring focus-visible:ring-offset-background flex h-full flex-col overflow-hidden rounded-sm border transition hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
      >
        {guia.coverUrl ? (
          <Image
            src={guia.coverUrl}
            alt=""
            width={640}
            height={360}
            sizes="(max-width: 768px) 17rem, 24rem"
            className="aspect-video w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          // Sin portada, un fondo de la casa: la tarjeta no se queda coja.
          <div
            aria-hidden
            className="from-primary/40 via-primary/10 to-card aspect-video w-full bg-gradient-to-br"
          />
        )}

        <div className="flex flex-1 flex-col gap-2 p-5">
          <p className="text-primary text-xs font-semibold tracking-wider uppercase">
            {minutos} min de lectura
          </p>

          <h3 className="font-heading text-foreground text-lg leading-snug font-bold text-balance">
            {guia.title}
          </h3>

          <p className="text-muted-foreground line-clamp-2 text-sm">
            {resumenDe(guia, 140)}
          </p>

          <span className="text-primary mt-auto pt-2 text-sm font-semibold">
            Leer la guía <span aria-hidden>→</span>
          </span>
        </div>
      </Link>
    </li>
  );
}

export function GuiasDePortada({
  guias,
  className,
}: {
  guias: GuiaDePortada[];
  className?: string;
}) {
  if (guias.length === 0) return null;

  return (
    <section className={cn('mx-auto max-w-6xl px-4 py-14', className)}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-heading text-foreground text-2xl font-bold">
            Guías y tutoriales
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Para jugadores y game masters, claras y al grano.
          </p>
        </div>

        <Link href="/blog" className="text-primary text-sm font-semibold hover:underline">
          Ver todas →
        </Link>
      </div>

      <ul className="-mx-4 mt-6 flex snap-x snap-mandatory [scrollbar-width:thin] gap-4 overflow-x-auto px-4 pb-4 md:mx-0 md:grid md:grid-cols-3 md:overflow-visible md:px-0 md:pb-0">
        {guias.map((guia) => (
          <Tarjeta
            key={guia.id}
            guia={guia}
            className="w-[17rem] shrink-0 snap-start sm:w-[19rem] md:w-auto"
          />
        ))}
      </ul>
    </section>
  );
}
