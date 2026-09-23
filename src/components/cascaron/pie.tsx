import Link from 'next/link';

/**
 * El pie.
 *
 * Aqui viven los enlaces que no caben en la cabecera pero que tienen que
 * existir en alguna parte: las condiciones, como funciona la garantia y la
 * captacion de game masters.
 */

const COLUMNAS = [
  {
    titulo: 'Jugar',
    enlaces: [
      { href: '/partidas', texto: 'Buscar partida' },
      { href: '/sistemas', texto: 'Qué se juega' },
      { href: '/gm', texto: 'Game masters' },
      { href: '/como-funciona', texto: 'Cómo funciona' },
    ],
  },
  {
    titulo: 'Dirigir',
    enlaces: [
      { href: '/para-game-masters', texto: 'Cobrar por dirigir' },
      { href: '/cuenta/gm', texto: 'Crear perfil de game master' },
      { href: '/cuenta/partidas/nueva', texto: 'Crear una partida' },
    ],
  },
  {
    titulo: 'La casa',
    enlaces: [
      { href: '/blog', texto: 'Blog' },
      { href: '/condiciones', texto: 'Condiciones' },
      { href: '/dashboard', texto: 'Mi cuenta' },
    ],
  },
] as const;

export function PieDePagina() {
  return (
    <footer className="border-border bg-card mt-auto border-t">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex flex-wrap gap-x-12 gap-y-8">
          <div className="min-w-[14rem] flex-1">
            <p className="font-heading text-foreground text-base font-extrabold">
              TuGameMaster
            </p>
            <p className="text-muted-foreground mt-2 max-w-xs text-sm">
              Mesas de rol dirigidas por game masters, con tu plaza pagada y garantizada.
            </p>
          </div>

          {COLUMNAS.map((columna) => (
            <nav key={columna.titulo} aria-label={columna.titulo}>
              <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                {columna.titulo}
              </p>
              <ul className="mt-3 flex flex-col gap-2 text-sm">
                {columna.enlaces.map((e) => (
                  <li key={e.href}>
                    <Link
                      href={e.href}
                      className="text-muted-foreground hover:text-foreground transition"
                    >
                      {e.texto}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <p className="border-border text-muted-foreground mt-10 border-t pt-6 text-xs">
          © {new Date().getFullYear()} TuGameMaster
        </p>
      </div>
    </footer>
  );
}
