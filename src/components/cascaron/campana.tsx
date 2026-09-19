'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

import type { Aviso } from '@/modules/notifications/avisos';

/**
 * La campanita y su panel.
 *
 * Se abre y se cierra en el navegador, pero **la lista llega ya resuelta
 * desde el servidor**: no hay sondeos ni conexiones abiertas. Se actualiza al
 * navegar, que para avisos asincronos es de sobra y no cuesta nada mantener.
 */

const TONO = {
  alerta: 'bg-destructive',
  accion: 'bg-primary',
  aviso: 'bg-muted-foreground',
} as const;

export function Campana({ avisos }: { avisos: Aviso[] }) {
  const [abierta, setAbierta] = useState(false);
  const caja = useRef<HTMLDivElement>(null);

  // Cerrar al pulsar fuera o con Escape: lo que espera cualquiera de un panel
  // desplegable, y lo que un `details` no da gratis.
  useEffect(() => {
    if (!abierta) return;

    function fuera(e: MouseEvent) {
      if (!caja.current?.contains(e.target as Node)) setAbierta(false);
    }
    function escape(e: KeyboardEvent) {
      if (e.key === 'Escape') setAbierta(false);
    }

    document.addEventListener('mousedown', fuera);
    document.addEventListener('keydown', escape);

    return () => {
      document.removeEventListener('mousedown', fuera);
      document.removeEventListener('keydown', escape);
    };
  }, [abierta]);

  const cuenta = avisos.length;

  return (
    <div ref={caja} className="relative">
      <button
        type="button"
        onClick={() => setAbierta((v) => !v)}
        aria-expanded={abierta}
        aria-haspopup="menu"
        className="text-muted-foreground hover:bg-secondary hover:text-foreground focus-visible:ring-ring relative grid size-9 place-items-center rounded-sm transition focus-visible:ring-2 focus-visible:outline-none"
      >
        <span className="sr-only">
          {cuenta === 0 ? 'Avisos' : `Avisos: ${cuenta} pendientes`}
        </span>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="size-5"
          aria-hidden
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>

        {cuenta > 0 && (
          <span
            aria-hidden
            className="border-card bg-primary text-primary-foreground absolute top-0.5 right-0.5 min-w-[18px] rounded-full border-2 px-1 text-[10px] leading-[14px] font-bold tabular-nums"
          >
            {cuenta > 9 ? '9+' : cuenta}
          </span>
        )}
      </button>

      {abierta && (
        <div
          role="menu"
          className="border-border bg-popover absolute right-0 z-50 mt-2 w-[min(20rem,calc(100vw-2rem))] overflow-hidden rounded-sm border shadow-xl shadow-black/40"
        >
          <p className="border-border text-muted-foreground border-b px-3 py-2 text-xs font-semibold tracking-wider uppercase">
            Avisos
          </p>

          {cuenta === 0 ? (
            <p className="text-muted-foreground px-3 py-6 text-center text-sm">
              No tienes nada pendiente.
            </p>
          ) : (
            <ul className="max-h-80 overflow-y-auto">
              {avisos.map((a) => (
                <li key={a.id}>
                  <Link
                    href={a.href}
                    onClick={() => setAbierta(false)}
                    role="menuitem"
                    className="hover:bg-secondary flex items-start gap-2.5 px-3 py-2.5 text-sm transition"
                  >
                    <span
                      aria-hidden
                      className={`mt-1.5 size-1.5 shrink-0 rounded-full ${TONO[a.tono]}`}
                    />
                    <span className="text-foreground">{a.texto}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
