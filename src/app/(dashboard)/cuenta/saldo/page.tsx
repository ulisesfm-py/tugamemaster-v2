import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { Fecha } from '@/components/ui';
import { auth } from '@/lib/auth';
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
    <main className="mx-auto max-w-2xl px-4 py-12">
      <Link
        href="/cuenta"
        className="text-sm text-slate-500 hover:underline dark:text-slate-400"
      >
        ← Mi perfil
      </Link>

      <h1 className="mt-4 text-2xl font-semibold text-slate-900 dark:text-slate-50">
        Mi saldo
      </h1>

      <section className="mt-6 rounded-xl border border-slate-200 p-6 dark:border-slate-800">
        <p className="text-sm text-slate-600 dark:text-slate-400">Disponible</p>
        <p className="mt-1 text-4xl font-semibold text-slate-900 dark:text-slate-50">
          {formatearImporte(saldo)}
        </p>
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
          Se aplica automáticamente al reservar tu próxima partida. No caduca.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
          Movimientos
        </h2>

        {apuntes.length === 0 ? (
          <p className="mt-3 rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-600 dark:border-slate-700 dark:text-slate-400">
            Todavía no tienes movimientos.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-slate-200 rounded-xl border border-slate-200 dark:divide-slate-800 dark:border-slate-800">
            {apuntes.map((a) => (
              <li key={a.id} className="flex items-start gap-4 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    {DESCRIPCION[a.type]}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {a.booking?.game.title ?? a.note ?? '—'}
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    <Fecha valor={a.createdAt} />
                  </p>
                </div>

                <p
                  className={`shrink-0 text-sm font-semibold ${
                    a.amountCents > 0
                      ? 'text-emerald-700 dark:text-emerald-400'
                      : 'text-slate-700 dark:text-slate-300'
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

      <section className="mt-10 space-y-2 text-sm text-slate-600 dark:text-slate-400">
        <h2 className="font-medium text-slate-900 dark:text-slate-100">Cómo funciona</h2>
        <p>
          Si cancelas una reserva con más de 48 horas de antelación, se te devuelve el 90%
          del precio en saldo. El 10% restante cubre los gastos de gestión.
        </p>
        <p>
          Si el game master no se presenta, se te devuelve el 100% en saldo. Si prefieres
          recuperarlo en tu tarjeta, escríbenos y lo revisamos.
        </p>
      </section>
    </main>
  );
}
