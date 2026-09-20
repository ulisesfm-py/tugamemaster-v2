'use client';

import Link from 'next/link';

import { Avatar } from '@/components/ui';

import { CLASE_PANEL, useDesplegable } from './use-desplegable';

/**
 * El menu de la cuenta, colgando del avatar.
 *
 * Antes el avatar era un enlace suelto al panel: quien lo pulsaba buscando
 * cerrar sesion acababa en otra pagina sin entender por que. Un avatar en la
 * esquina superior derecha promete un menu, asi que ahora lo hay.
 *
 * `salir` llega como propiedad desde la cabecera, que es un componente de
 * servidor: la accion se ejecuta alli y aqui solo se pulsa.
 */
export function MenuUsuario({
  nombre,
  imagen,
  slug,
  esGm,
  esAdmin,
  salir,
}: {
  nombre: string;
  imagen: string | null;
  slug: string;
  esGm: boolean;
  esAdmin: boolean;
  salir: () => Promise<void>;
}) {
  const { abierta, setAbierta, caja } = useDesplegable();

  const enlaces = [
    { href: '/dashboard', texto: 'Mi panel' },
    { href: '/mis-reservas', texto: 'Mis reservas' },
    { href: '/cuenta/saldo', texto: 'Mi saldo' },
    ...(esGm
      ? [
          { href: '/cuenta/partidas', texto: 'Mis partidas' },
          { href: '/cuenta/cobros', texto: 'Mis ingresos' },
        ]
      : [{ href: '/cuenta/gm', texto: 'Empezar a dirigir' }]),
    { href: `/u/${slug}`, texto: 'Mi perfil público' },
    { href: '/cuenta', texto: 'Editar mi perfil' },
    ...(esAdmin ? [{ href: '/admin/incidencias', texto: 'Administración' }] : []),
  ];

  return (
    <div ref={caja} className="relative">
      <button
        type="button"
        onClick={() => setAbierta((v) => !v)}
        aria-expanded={abierta}
        aria-haspopup="menu"
        className="hover:bg-secondary focus-visible:ring-ring flex items-center gap-1 rounded-sm p-1 transition focus-visible:ring-2 focus-visible:outline-none"
      >
        <span className="sr-only">Mi cuenta</span>
        <Avatar src={imagen} nombre={nombre} tamano={28} />
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`text-muted-foreground size-3.5 transition-transform ${
            abierta ? 'rotate-180' : ''
          }`}
          aria-hidden
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {abierta && (
        <div role="menu" className={`${CLASE_PANEL} w-56`}>
          <p className="border-border text-foreground truncate border-b px-3 py-2.5 text-sm font-semibold">
            {nombre}
          </p>

          <ul className="py-1">
            {enlaces.map((e) => (
              <li key={e.href}>
                <Link
                  href={e.href}
                  role="menuitem"
                  onClick={() => setAbierta(false)}
                  className="text-foreground hover:bg-secondary block px-3 py-2 text-sm transition"
                >
                  {e.texto}
                </Link>
              </li>
            ))}
          </ul>

          <form action={salir} className="border-border border-t">
            <button
              type="submit"
              role="menuitem"
              className="text-muted-foreground hover:bg-secondary hover:text-foreground block w-full px-3 py-2.5 text-left text-sm transition"
            >
              Cerrar sesión
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
