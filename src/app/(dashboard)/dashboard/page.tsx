import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { Button, EnlaceBoton, Estado, Fecha, Vacio } from '@/components/ui';
import { auth } from '@/lib/auth';
import { misReservas } from '@/modules/bookings/queries';
import { avisosDe } from '@/modules/notifications/avisos';
import { formatearImporte } from '@/modules/payments/dinero';
import { resumenDeGm } from '@/modules/payments/ingresos';
import { salirAction } from '@/modules/users/actions';
import { saldoDe } from '@/modules/wallet/service';

export const metadata: Metadata = { title: 'Mi cuenta · TuGameMaster' };

/** Un enlace del bloque de accesos. */
function Acceso({ href, texto }: { href: string; texto: string }) {
  return (
    <Link
      href={href}
      className="border-border bg-card hover:border-primary hover:text-primary focus-visible:ring-ring focus-visible:ring-offset-background text-foreground rounded-sm border px-4 py-3 text-sm font-medium transition focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
    >
      {texto}
    </Link>
  );
}

export default async function DashboardPage() {
  const session = await auth();

  // El middleware ya bloquea esta ruta, pero la comprobacion se repite aqui:
  // la seguridad no puede depender de una sola capa, y ademas es lo que hace
  // que TypeScript sepa que `session` existe a partir de esta linea.
  if (!session?.user) redirect('/login');

  const { user } = session;

  const [saldo, avisos, reservas, ingresos] = await Promise.all([
    saldoDe(user.id),
    avisosDe(user.id),
    misReservas(user.id),
    resumenDeGm(user.id),
  ]);

  const proximas = reservas.proximas.slice(0, 3);

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="font-heading text-foreground text-3xl font-extrabold sm:text-4xl">
        Hola, {user.name}
      </h1>
      <p className="text-muted-foreground mt-2">
        <Link href={`/u/${user.slug}`} className="hover:underline">
          Ver mi perfil público
        </Link>
      </p>

      {/* ── Te toca hacer ─────────────────────────────────────────
          Sale de la misma lista derivada que alimenta la campanita: una
          pieza, dos sitios donde se asoma. Si no hay nada pendiente, el
          bloque no existe en vez de decir «no tienes nada». */}
      {avisos.length > 0 && (
        <section className="border-primary/35 bg-primary/5 mt-8 rounded-sm border p-5">
          <h2 className="font-heading text-primary text-base font-bold">Te toca hacer</h2>
          <ul className="mt-3 flex flex-col gap-2">
            {avisos.map((aviso) => (
              <li key={aviso.id}>
                <Link
                  href={aviso.href}
                  className="text-foreground text-sm hover:underline"
                >
                  {aviso.texto}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {/* ── Saldo ────────────────────────────────────────────── */}
        <section className="border-border bg-card flex flex-col rounded-sm border p-5">
          <h2 className="text-muted-foreground text-xs font-semibold tracking-widest uppercase">
            Mi saldo
          </h2>
          <p className="font-heading text-primary mt-1 text-3xl font-extrabold tabular-nums">
            {formatearImporte(saldo)}
          </p>
          <p className="text-muted-foreground mt-2 flex-1 text-sm">
            {saldo > 0
              ? 'Se descuenta solo al reservar tu próxima partida. No caduca.'
              : 'Aquí aparecerá el dinero de una devolución. Se aplica solo al reservar.'}
          </p>
          <div className="mt-4">
            <EnlaceBoton href="/cuenta/saldo" variante="perfil" tamano="sm">
              Ver movimientos
            </EnlaceBoton>
          </div>
        </section>

        {/* ── Ingresos, solo si dirige ─────────────────────────── */}
        {ingresos && (
          <section className="border-border bg-card flex flex-col rounded-sm border p-5">
            <h2 className="text-muted-foreground text-xs font-semibold tracking-widest uppercase">
              Mis ingresos
            </h2>
            <p className="font-heading text-foreground mt-1 text-3xl font-extrabold tabular-nums">
              {formatearImporte(ingresos.resumen.cobradoCents)}
            </p>
            <p className="text-muted-foreground mt-2 flex-1 text-sm">
              Cobrado. Hay {formatearImporte(ingresos.resumen.enCaminoCents)} en camino
              {ingresos.resumen.retenidoCents > 0 && (
                <> y {formatearImporte(ingresos.resumen.retenidoCents)} retenidos</>
              )}
              .
            </p>
            <div className="mt-4">
              <EnlaceBoton href="/cuenta/cobros" variante="perfil" tamano="sm">
                Ver el detalle
              </EnlaceBoton>
            </div>
          </section>
        )}
      </div>

      <section className="mt-10">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="font-heading text-foreground text-xl font-bold">
            Tus próximas mesas
          </h2>
          {reservas.proximas.length > 3 && (
            <Link href="/mis-reservas" className="text-primary text-sm hover:underline">
              Ver todas ({reservas.proximas.length})
            </Link>
          )}
        </div>

        {proximas.length === 0 ? (
          <Vacio
            className="mt-4"
            titulo="No tienes ninguna mesa reservada"
            accion={<EnlaceBoton href="/partidas">Buscar mesa</EnlaceBoton>}
          >
            Cuando reserves una plaza, aparecerá aquí con su fecha.
          </Vacio>
        ) : (
          <ul className="border-border divide-border mt-4 divide-y rounded-sm border">
            {proximas.map((reserva) => (
              <li
                key={reserva.id}
                className="flex flex-wrap items-center gap-3 px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/partidas/${reserva.game.slug}`}
                    className="text-foreground text-sm font-medium hover:underline"
                  >
                    {reserva.game.title}
                  </Link>
                  <p className="text-muted-foreground text-xs">
                    {reserva.game.system} · <Fecha valor={reserva.game.startsAt} />
                  </p>
                </div>

                {reserva.status === 'PENDING' && <Estado tono="espera">Sin pagar</Estado>}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10">
        <h2 className="font-heading text-foreground text-xl font-bold">Accesos</h2>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Acceso href="/mis-reservas" texto="Mis reservas" />
          <Acceso href="/cuenta/saldo" texto="Mi saldo" />
          <Acceso href="/cuenta" texto="Editar mi perfil" />

          {ingresos ? (
            <>
              <Acceso href="/cuenta/partidas" texto="Mis partidas" />
              <Acceso href="/cuenta/cobros" texto="Mis ingresos" />
              <Acceso href="/cuenta/gm" texto="Perfil de game master" />
            </>
          ) : (
            <Acceso href="/cuenta/gm" texto="Empezar a dirigir" />
          )}

          {user.isAdmin && (
            <>
              <Acceso href="/admin/incidencias" texto="Revisar incidencias" />
              <Acceso href="/admin/blog" texto="Escribir en el blog" />
            </>
          )}
        </div>
      </section>

      <form action={salirAction} className="mt-10">
        <Button type="submit" variante="fantasma">
          Cerrar sesión
        </Button>
      </form>
    </main>
  );
}
