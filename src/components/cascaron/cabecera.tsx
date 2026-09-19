import Link from 'next/link';

import { Avatar } from '@/components/ui';
import { auth } from '@/lib/auth';
import { avisosDe } from '@/modules/notifications/avisos';

import { Campana } from './campana';

/**
 * La cabecera de la web.
 *
 * Hasta ahora no habia ninguna: cada pagina enlazaba a mano a las que su autor
 * recordaba, y al blog solo se llegaba desde la portada.
 *
 * Es un componente de servidor: lee la sesion y los avisos aqui, de modo que
 * la campanita llega al navegador con su lista ya hecha.
 */

const MENU = [
  { href: '/partidas', texto: 'Partidas' },
  { href: '/gm', texto: 'Game masters' },
  { href: '/blog', texto: 'Blog' },
] as const;

export async function Cabecera() {
  const session = await auth();
  const usuario = session?.user;
  const avisos = usuario ? await avisosDe(usuario.id) : [];

  return (
    <header className="border-border bg-card/95 supports-[backdrop-filter]:bg-card/80 sticky top-0 z-40 border-b backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4 sm:gap-6">
        <Link
          href="/"
          className="font-heading text-foreground hover:text-primary text-lg font-extrabold tracking-tight transition"
        >
          TuGameMaster
        </Link>

        {/* El menu se oculta en pantallas estrechas; el recorrido principal
            sigue disponible desde la portada y desde el pie. */}
        <nav aria-label="Principal" className="hidden gap-5 text-sm sm:flex">
          {MENU.map((e) => (
            <Link
              key={e.href}
              href={e.href}
              className="text-muted-foreground hover:text-foreground transition"
            >
              {e.texto}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {usuario ? (
            <>
              <Campana avisos={avisos} />
              <Link
                href="/dashboard"
                className="hover:bg-secondary focus-visible:ring-ring flex items-center gap-2 rounded-sm p-1 transition focus-visible:ring-2 focus-visible:outline-none"
              >
                <span className="sr-only">Mi cuenta</span>
                <Avatar
                  src={usuario.image ?? null}
                  nombre={usuario.name ?? '?'}
                  tamano={28}
                />
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-muted-foreground hover:text-foreground rounded-sm px-3 py-2 text-sm font-medium transition"
              >
                Entrar
              </Link>
              <Link
                href="/registro"
                className="bg-primary text-primary-foreground rounded-sm px-3.5 py-2 text-sm font-semibold shadow-[0_2px_0_#9c3d16] transition hover:-translate-y-px hover:shadow-[0_3px_0_#9c3d16] active:translate-y-px active:shadow-[0_1px_0_#9c3d16]"
              >
                Crear cuenta
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
