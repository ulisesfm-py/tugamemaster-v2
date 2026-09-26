import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { Estado } from '@/components/ui';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { formatearImporte } from '@/modules/payments/dinero';
import { saldoPendienteTotal } from '@/modules/wallet/service';

export const metadata: Metadata = { title: 'Administración · TuGameMaster' };

/**
 * Indice de administracion.
 *
 * `/admin` no existia: se llegaba a las dos pantallas por enlaces sueltos
 * desde el panel, y quien escribia la direccion a mano se encontraba un 404.
 */

function Atajo({
  href,
  titulo,
  descripcion,
  distintivo,
}: {
  href: string;
  titulo: string;
  descripcion: string;
  distintivo?: React.ReactNode;
}) {
  return (
    <li>
      <Link
        href={href}
        className="border-border bg-card hover:border-primary focus-visible:ring-ring focus-visible:ring-offset-background block h-full rounded-sm border p-5 transition focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
      >
        <span className="flex flex-wrap items-center gap-2">
          <span className="font-heading text-foreground font-bold">{titulo}</span>
          {distintivo}
        </span>
        <span className="text-muted-foreground mt-1 block text-sm">{descripcion}</span>
      </Link>
    </li>
  );
}

export default async function AdminPage() {
  const session = await auth();

  // El middleware ya bloquea /admin, pero se repite aqui: la seguridad no
  // puede depender de una sola capa.
  if (!session?.user?.isAdmin) notFound();

  const [incidenciasAbiertas, borradores, pagosBloqueados, saldoPendiente, denuncias] =
    await Promise.all([
      db.incident.count({ where: { status: 'OPEN' } }),
      db.post.count({ where: { status: { not: 'PUBLISHED' } } }),
      db.payout.count({ where: { status: { in: ['BLOCKED', 'FAILED'] } } }),
      saldoPendienteTotal(),
      db.threadMessage.count({ where: { reportedAt: { not: null }, removedAt: null } }),
    ]);

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="font-heading text-foreground text-3xl font-extrabold sm:text-4xl">
        Administración
      </h1>
      <p className="text-muted-foreground mt-2">
        Lo que hay que mirar de vez en cuando, y lo que hay que resolver hoy.
      </p>

      <ul className="mt-8 grid gap-4 sm:grid-cols-2">
        <Atajo
          href="/admin/incidencias"
          titulo="Incidencias"
          descripcion="Reclamaciones sobre partidas ya jugadas. Cada una detiene el pago a su game master."
          distintivo={
            incidenciasAbiertas > 0 ? (
              <Estado tono="espera">{incidenciasAbiertas} sin resolver</Estado>
            ) : undefined
          }
        />

        <Atajo
          href="/admin/hilos"
          titulo="Mensajes denunciados"
          descripcion="Lo que alguien ha marcado en el hilo de una partida. El game master no expulsa: decide un admin."
          distintivo={
            denuncias > 0 ? (
              <Estado tono="espera">{denuncias} sin revisar</Estado>
            ) : undefined
          }
        />

        <Atajo
          href="/admin/blog"
          titulo="Blog"
          descripcion="Escribir, publicar y retirar artículos."
          distintivo={
            borradores > 0 ? (
              <Estado tono="apagado">{borradores} sin publicar</Estado>
            ) : undefined
          }
        />
      </ul>

      {/* El dinero que debemos, que hasta ahora se calculaba y no lo veia
          nadie. Conviene poder compararlo con lo que de verdad retenemos en
          Stripe: si se separan, hay un apunte de monedero mal puesto. */}
      <section className="border-border bg-card mt-10 rounded-sm border p-5">
        <h2 className="font-heading text-foreground text-base font-bold">
          Dinero en el aire
        </h2>

        <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-5">
          <div className="flex flex-col">
            <dt className="text-muted-foreground order-2 mt-0.5 text-xs font-semibold tracking-widest uppercase">
              Saldo de los usuarios
            </dt>
            <dd className="font-heading text-foreground order-1 text-2xl font-extrabold tabular-nums">
              {formatearImporte(saldoPendiente)}
            </dd>
            <dd className="text-muted-foreground order-3 mt-1 text-xs">
              Lo que debemos. Debería cuadrar con lo retenido en Stripe.
            </dd>
          </div>

          <div className="flex flex-col">
            <dt className="text-muted-foreground order-2 mt-0.5 text-xs font-semibold tracking-widest uppercase">
              Pagos detenidos
            </dt>
            <dd
              className={`font-heading order-1 text-2xl font-extrabold tabular-nums ${
                pagosBloqueados > 0 ? 'text-destructive' : 'text-foreground'
              }`}
            >
              {pagosBloqueados}
            </dd>
            <dd className="text-muted-foreground order-3 mt-1 text-xs">
              Transferencias bloqueadas o fallidas que el cron reintenta.
            </dd>
          </div>
        </dl>
      </section>
    </main>
  );
}
