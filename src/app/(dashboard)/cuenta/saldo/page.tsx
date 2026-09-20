import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { EnlaceBoton, Fecha, Vacio } from '@/components/ui';
import { auth } from '@/lib/auth';
import {
  PORCENTAJE_DEVOLUCION,
  PORCENTAJE_DEVOLUCION_INCIDENCIA,
  HORAS_CANCELACION_CON_DEVOLUCION,
} from '@/modules/bookings/politica';
import { formatearImporte } from '@/modules/payments/dinero';
import { movimientos, saldoDe } from '@/modules/wallet/service';

export const metadata: Metadata = { title: 'Mi saldo · TuGameMaster' };

const DESCRIPCION = {
  REFUND_CREDIT: 'Devolución',
  BOOKING_PAYMENT: 'Usado en una reserva',
  ADMIN_ADJUSTMENT: 'Ajuste',
  CASH_OUT: 'Devuelto a tu tarjeta',
} as const;

export default async function SaldoPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const [saldo, apuntes] = await Promise.all([
    saldoDe(session.user.id),
    movimientos(session.user.id),
  ]);

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <Link href="/dashboard" className="text-muted-foreground text-sm hover:underline">
        ← Mi cuenta
      </Link>

      <h1 className="font-heading text-foreground mt-4 text-3xl font-extrabold sm:text-4xl">
        Mi saldo
      </h1>

      <section className="border-border bg-card mt-6 rounded-sm border p-6">
        <p className="text-muted-foreground text-xs font-semibold tracking-widest uppercase">
          Disponible
        </p>
        <p className="font-heading text-primary mt-1 text-4xl font-extrabold tabular-nums">
          {formatearImporte(saldo)}
        </p>
        <p className="text-muted-foreground mt-3 text-sm">
          Se aplica solo al reservar tu próxima partida. No caduca y no hace falta hacer
          nada para usarlo.
        </p>

        {saldo > 0 && (
          <div className="mt-5">
            <EnlaceBoton href="/partidas">Buscar mesa</EnlaceBoton>
          </div>
        )}
      </section>

      <section className="mt-10">
        <h2 className="font-heading text-foreground text-xl font-bold">Movimientos</h2>

        {apuntes.length === 0 ? (
          <Vacio className="mt-4" titulo="Todavía no tienes movimientos">
            Aquí aparecerá cualquier devolución, y también el saldo que uses al reservar.
          </Vacio>
        ) : (
          /* Cada apunte enlaza con la partida que lo origino: un abono sin
             saber de donde viene es un numero, no una explicacion. */
          <ul className="border-border divide-border mt-4 divide-y rounded-sm border">
            {apuntes.map((a) => (
              <li key={a.id} className="flex items-start gap-4 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-foreground text-sm font-medium">
                    {DESCRIPCION[a.type]}
                  </p>

                  <p className="text-muted-foreground text-xs">
                    {a.booking?.game ? (
                      <Link
                        href={`/partidas/${a.booking.game.slug}`}
                        className="hover:underline"
                      >
                        {a.booking.game.title}
                      </Link>
                    ) : (
                      (a.note ?? '—')
                    )}
                  </p>

                  <p className="text-muted-foreground/70 text-xs">
                    <Fecha valor={a.createdAt} />
                  </p>
                </div>

                <p
                  className={`shrink-0 text-sm font-semibold tabular-nums ${
                    a.amountCents > 0 ? 'text-success' : 'text-muted-foreground'
                  }`}
                >
                  {a.amountCents > 0 ? '+' : '−'}
                  {formatearImporte(Math.abs(a.amountCents), a.currency)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Los porcentajes salen de politica.ts, que es lo que ejecuta el
          codigo que mueve el dinero. Escritos a mano acabarian mintiendo. */}
      <section className="text-muted-foreground mt-10 flex flex-col gap-3 text-sm">
        <h2 className="font-heading text-foreground text-xl font-bold">Cómo funciona</h2>
        <p>
          Si cancelas con más de {HORAS_CANCELACION_CON_DEVOLUCION} horas de antelación,
          se te devuelve el {PORCENTAJE_DEVOLUCION}% del precio en saldo. El{' '}
          {100 - PORCENTAJE_DEVOLUCION}% restante cubre los gastos de gestión.
        </p>
        <p>
          Si el game master cancela o no se presenta, se te devuelve el{' '}
          {PORCENTAJE_DEVOLUCION_INCIDENCIA}%. Si prefieres recuperarlo en tu tarjeta,
          escríbenos y lo revisamos.
        </p>
        <p>
          Al reservar se descuenta primero del saldo y solo se cobra a la tarjeta lo que
          falte.
        </p>
      </section>
    </main>
  );
}
