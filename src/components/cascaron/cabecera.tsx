import Link from 'next/link';

import { Logotipo } from '@/components/marca/logotipo';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { avisosDe } from '@/modules/notifications/avisos';
import { salirAction } from '@/modules/users/actions';
import { saldoDe } from '@/modules/wallet/service';

import { Campana } from './campana';
import { MenuPrincipal } from './menu-principal';
import { MenuUsuario } from './menu-usuario';
import { Saldo } from './saldo';

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

  const [avisos, saldo, perfilGm] = usuario
    ? await Promise.all([
        avisosDe(usuario.id),
        saldoDe(usuario.id),
        // Solo para saber que enlaces ensenar en el menu: la existencia de un
        // perfil de GM es lo que convierte a alguien en game master.
        db.gmProfile.findUnique({
          where: { userId: usuario.id },
          select: { id: true },
        }),
      ])
    : [[], 0, null];

  return (
    <header className="border-border bg-card/95 supports-[backdrop-filter]:bg-card/80 sticky top-0 z-40 border-b backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-2 px-4 sm:gap-6">
        {/* En pantallas estrechas las secciones viven detras de este boton; a
            partir de `sm` se ensenan en fila. Antes se ocultaban sin mas, y en
            un telefono no habia forma de llegar a ninguna desde arriba. */}
        <MenuPrincipal enlaces={MENU} />

        <Link
          href="/"
          className="text-foreground hover:text-primary focus-visible:ring-ring shrink-0 rounded-sm transition focus-visible:ring-2 focus-visible:outline-none"
        >
          <Logotipo compacto />
        </Link>

        <nav aria-label="Principal" className="hidden gap-5 text-sm sm:flex">
          {MENU.map((e) => (
            <Link
              key={e.href}
              href={e.href}
              className="text-muted-foreground hover:text-foreground focus-visible:ring-ring rounded-sm transition focus-visible:ring-2 focus-visible:outline-none"
            >
              {e.texto}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {usuario ? (
            <>
              <Saldo cents={saldo} />
              <Campana avisos={avisos} />
              <MenuUsuario
                nombre={usuario.name ?? '?'}
                imagen={usuario.image ?? null}
                slug={usuario.slug}
                esGm={perfilGm !== null}
                esAdmin={usuario.isAdmin === true}
                salir={salirAction}
              />
            </>
          ) : (
            <>
              {/* Sin `whitespace-nowrap` los dos botones parten en dos lineas
                  a 375 px y se salen de la barra. */}
              <Link
                href="/login"
                className="text-muted-foreground hover:text-foreground focus-visible:ring-ring rounded-sm px-2 py-2 text-sm font-medium whitespace-nowrap transition focus-visible:ring-2 focus-visible:outline-none sm:px-3"
              >
                Entrar
              </Link>
              <Link
                href="/registro"
                className="bg-primary text-primary-foreground focus-visible:ring-ring focus-visible:ring-offset-background rounded-sm px-2.5 py-2 text-sm font-semibold whitespace-nowrap shadow-[0_2px_0_#9c3d16] transition hover:-translate-y-px hover:shadow-[0_3px_0_#9c3d16] focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none active:translate-y-px active:shadow-[0_1px_0_#9c3d16] sm:px-3.5"
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
