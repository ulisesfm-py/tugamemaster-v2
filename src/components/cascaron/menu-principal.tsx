'use client';

import Link from 'next/link';

import { CLASE_PANEL, useDesplegable } from './use-desplegable';

/**
 * El menu de secciones, para pantallas estrechas.
 *
 * En la cabecera los enlaces principales estaban ocultos por debajo de 640 px,
 * asi que en un telefono no habia forma de llegar a Partidas, Game masters ni
 * Blog: solo desde el pie, al final de todo el scroll. Con la mitad del
 * trafico en movil, eso no es un detalle de estilo.
 *
 * Comparte con la campanita y el menu de cuenta el cerrarse al pulsar fuera y
 * con Escape.
 */
export function MenuPrincipal({
  enlaces,
}: {
  enlaces: readonly { href: string; texto: string }[];
}) {
  const { abierta, setAbierta, caja } = useDesplegable();

  return (
    <div ref={caja} className="relative sm:hidden">
      <button
        type="button"
        onClick={() => setAbierta((v) => !v)}
        aria-expanded={abierta}
        aria-haspopup="menu"
        className="text-muted-foreground hover:bg-secondary hover:text-foreground focus-visible:ring-ring grid size-9 place-items-center rounded-sm transition focus-visible:ring-2 focus-visible:outline-none"
      >
        <span className="sr-only">Secciones</span>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          className="size-5"
          aria-hidden
        >
          {abierta ? (
            <path d="M18 6 6 18M6 6l12 12" />
          ) : (
            <path d="M3 6h18M3 12h18M3 18h18" />
          )}
        </svg>
      </button>

      {abierta && (
        <div role="menu" className={`${CLASE_PANEL} left-0 w-52`}>
          <ul className="py-1">
            {enlaces.map((e) => (
              <li key={e.href}>
                <Link
                  href={e.href}
                  role="menuitem"
                  onClick={() => setAbierta(false)}
                  className="text-foreground hover:bg-secondary block px-3 py-2.5 text-sm transition"
                >
                  {e.texto}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
