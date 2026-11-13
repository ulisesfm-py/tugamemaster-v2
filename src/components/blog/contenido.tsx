import Image from 'next/image';
import Link from 'next/link';
import { Fragment } from 'react';

import { cn } from '@/lib/utils';
import {
  leerContenido,
  type Bloque,
  type Inline,
  type TonoDeAviso,
} from '@/modules/blog/contenido';

import { VideoYoutube } from './video-youtube';

/**
 * Pinta el cuerpo de un articulo.
 *
 * Recibe el texto tal como lo escribio el administrador y lo pasa por
 * `leerContenido`. Todo lo que sale de aqui son elementos de React, que
 * escapan el texto solos: no hay `dangerouslySetInnerHTML` ni se interpreta
 * HTML. Las direcciones de imagenes, videos y enlaces ya vienen filtradas.
 */

const ESTILO_DE_AVISO: Record<TonoDeAviso, { caja: string; etiqueta: string }> = {
  consejo: {
    caja: 'border-primary/40 bg-primary/10',
    etiqueta: 'text-primary',
  },
  nota: {
    caja: 'border-border bg-card',
    etiqueta: 'text-muted-foreground',
  },
  ojo: {
    caja: 'border-warning/40 bg-warning/10',
    etiqueta: 'text-warning',
  },
};

const ENLACE = 'text-primary underline underline-offset-2 hover:no-underline';

function EnLinea({ nodos }: { nodos: Inline[] }) {
  return (
    <>
      {nodos.map((nodo, i) => {
        if (nodo.tipo === 'texto') return <Fragment key={i}>{nodo.texto}</Fragment>;

        if (nodo.tipo === 'negrita') {
          return (
            <strong key={i} className="text-foreground font-semibold">
              <EnLinea nodos={nodo.hijos} />
            </strong>
          );
        }

        if (nodo.externo) {
          return (
            <a
              key={i}
              href={nodo.href}
              target="_blank"
              rel="noopener noreferrer"
              className={ENLACE}
            >
              <EnLinea nodos={nodo.hijos} />
            </a>
          );
        }

        return nodo.href.startsWith('#') ? (
          <a key={i} href={nodo.href} className={ENLACE}>
            <EnLinea nodos={nodo.hijos} />
          </a>
        ) : (
          <Link key={i} href={nodo.href} className={ENLACE}>
            <EnLinea nodos={nodo.hijos} />
          </Link>
        );
      })}
    </>
  );
}

/** Lineas de un parrafo: los saltos de linea del autor se respetan. */
function Lineas({ lineas }: { lineas: Inline[][] }) {
  return (
    <>
      {lineas.map((linea, i) => (
        <Fragment key={i}>
          {i > 0 && <br />}
          <EnLinea nodos={linea} />
        </Fragment>
      ))}
    </>
  );
}

function Pie({ texto }: { texto: string | null }) {
  if (!texto) return null;

  return (
    <figcaption className="text-muted-foreground mt-2 text-center text-sm">
      {texto}
    </figcaption>
  );
}

function titularDe(texto: string): string {
  return texto || 'Vídeo del artículo';
}

function BloqueDeContenido({ bloque }: { bloque: Bloque }) {
  switch (bloque.tipo) {
    case 'titulo': {
      const Etiqueta = bloque.nivel === 2 ? 'h2' : 'h3';

      return (
        <Etiqueta
          id={bloque.id}
          className={cn(
            'font-heading text-foreground scroll-mt-24 text-balance',
            bloque.nivel === 2
              ? 'mt-14 text-2xl font-bold first:mt-0 sm:text-3xl'
              : 'mt-10 text-xl font-semibold first:mt-0',
          )}
        >
          <EnLinea nodos={bloque.hijos} />
        </Etiqueta>
      );
    }

    case 'parrafo':
      return (
        <p className="mt-5 first:mt-0">
          <Lineas lineas={bloque.lineas} />
        </p>
      );

    case 'lista': {
      const Lista = bloque.ordenada ? 'ol' : 'ul';

      return (
        <Lista
          className={cn(
            'marker:text-primary mt-5 flex flex-col gap-2 pl-6',
            bloque.ordenada ? 'list-decimal' : 'list-disc',
          )}
        >
          {bloque.items.map((item, i) => (
            <li key={i} className="pl-1">
              <EnLinea nodos={item} />
            </li>
          ))}
        </Lista>
      );
    }

    case 'aviso': {
      const estilo = ESTILO_DE_AVISO[bloque.tono];

      return (
        <aside className={cn('mt-6 rounded-sm border p-4', estilo.caja)}>
          {bloque.titulo && (
            <p
              className={cn(
                'text-xs font-semibold tracking-wider uppercase',
                estilo.etiqueta,
              )}
            >
              {bloque.titulo}
            </p>
          )}
          <p className={cn('text-foreground/90', bloque.titulo && 'mt-1.5')}>
            <Lineas lineas={bloque.lineas} />
          </p>
        </aside>
      );
    }

    case 'separador':
      return <hr className="border-border my-12" />;

    case 'imagen':
      return (
        <figure className="mx-auto mt-8 max-w-3xl">
          <Image
            src={bloque.src}
            alt={bloque.alt}
            width={1600}
            height={900}
            sizes="(max-width: 48rem) 100vw, 48rem"
            unoptimized={bloque.src.toLowerCase().endsWith('.gif')}
            className="border-border h-auto w-full rounded-sm border"
          />
          <Pie texto={bloque.pie} />
        </figure>
      );

    case 'youtube':
      return (
        <figure className="mx-auto mt-8 max-w-3xl">
          <VideoYoutube id={bloque.id} titulo={titularDe(bloque.pie ?? '')} />
          <Pie texto={bloque.pie} />
        </figure>
      );

    case 'clip':
      return (
        <figure className="mx-auto mt-8 max-w-3xl">
          <video
            src={bloque.src}
            controls
            playsInline
            preload="metadata"
            aria-label={titularDe(bloque.pie ?? '')}
            className="border-border h-auto w-full rounded-sm border"
          />
          <Pie texto={bloque.pie} />
        </figure>
      );
  }
}

export function ContenidoBlog({
  texto,
  className,
}: {
  texto: string;
  className?: string;
}) {
  const { bloques } = leerContenido(texto);

  return (
    <article
      className={cn(
        'text-foreground/90 leading-relaxed lg:text-lg lg:leading-8',
        className,
      )}
    >
      {bloques.map((bloque, i) => (
        <BloqueDeContenido key={i} bloque={bloque} />
      ))}
    </article>
  );
}
