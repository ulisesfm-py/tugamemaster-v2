'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { cn } from '@/lib/utils';

/**
 * Fila de tarjetas que se desliza en horizontal.
 *
 * - **Sin barra de desplazamiento.** La del navegador de escritorio es gruesa y
 *   gris, y desentona con el resto de la web. En movil se desliza con el dedo,
 *   y que la siguiente tarjeta asome ya dice que hay mas.
 * - **Flechas en escritorio**, y solo cuando hace falta: si todas las tarjetas
 *   caben, no hay nada que mover y no se pinta ninguna; si caben a medias, solo
 *   sale la del lado hacia el que queda algo por ver.
 * - Es una fila y no un carrusel que rota solo: se ven varias tarjetas a la vez
 *   y ninguna se esconde.
 *
 * Los hijos son los `<li>`; el `<ul>` lo pone este componente. `className` va al
 * `<ul>`. Si la fila sangra con `-mx-4 px-4` para llegar al borde de la pantalla,
 * hay que poner tambien `scroll-px-4`: sin el, el ajuste de las tarjetas ignora
 * ese margen y la fila arranca desplazada, con la primera tarjeta cortada.
 */

const FLECHA = {
  anterior: 'm15 18-6-6 6-6',
  siguiente: 'm9 18 6-6-6-6',
} as const;

function Flecha({
  sentido,
  etiqueta,
  onClick,
}: {
  sentido: keyof typeof FLECHA;
  etiqueta: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={etiqueta}
      className={cn(
        'border-border bg-card/95 text-foreground hover:border-primary hover:text-primary focus-visible:ring-ring focus-visible:ring-offset-background absolute top-1/2 z-10 hidden size-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border shadow-lg shadow-black/40 backdrop-blur-sm transition focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none md:flex',
        sentido === 'anterior' ? 'left-0 -translate-x-1/3' : 'right-0 translate-x-1/3',
      )}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="size-5"
        aria-hidden
      >
        <path d={FLECHA[sentido]} />
      </svg>
    </button>
  );
}

export function FilaDeslizable({
  children,
  className,
  etiqueta,
}: {
  children: React.ReactNode;
  className?: string;
  /** Lo que contiene la fila, para el texto de las flechas: «partidas». */
  etiqueta: string;
}) {
  const fila = useRef<HTMLUListElement>(null);
  const [puedeRetroceder, setPuedeRetroceder] = useState(false);
  const [puedeAvanzar, setPuedeAvanzar] = useState(false);

  const medir = useCallback(() => {
    const el = fila.current;
    if (!el) return;

    // Un pixel de margen: los navegadores redondean el desplazamiento.
    setPuedeRetroceder(el.scrollLeft > 1);
    setPuedeAvanzar(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  }, []);

  useEffect(() => {
    const el = fila.current;
    if (!el) return;

    medir();

    // Cambia el ancho de la ventana, o el de la fila al cargarse una imagen.
    const observador = new ResizeObserver(medir);
    observador.observe(el);
    for (const hijo of Array.from(el.children)) observador.observe(hijo);

    return () => observador.disconnect();
  }, [medir, children]);

  function mover(sentido: 1 | -1) {
    const el = fila.current;
    if (!el) return;

    // Casi un ancho de fila: se ve lo nuevo sin perder del todo lo anterior. El
    // ajuste a la tarjeta lo hace `snap`.
    const reducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollBy({
      left: sentido * Math.round(el.clientWidth * 0.85),
      behavior: reducido ? 'auto' : 'smooth',
    });
  }

  return (
    <div className="relative">
      {puedeRetroceder && (
        <Flecha
          sentido="anterior"
          etiqueta={`Ver ${etiqueta} anteriores`}
          onClick={() => mover(-1)}
        />
      )}
      {puedeAvanzar && (
        <Flecha
          sentido="siguiente"
          etiqueta={`Ver más ${etiqueta}`}
          onClick={() => mover(1)}
        />
      )}

      <ul
        ref={fila}
        onScroll={medir}
        className={cn(
          'flex snap-x snap-mandatory [scrollbar-width:none] overflow-x-auto [&::-webkit-scrollbar]:hidden',
          className,
        )}
      >
        {children}
      </ul>
    </div>
  );
}
