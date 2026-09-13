import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { ReservarBoton } from '@/components/reservar-boton';
import { auth } from '@/lib/auth';
import { stripeEnabled } from '@/lib/stripe';
import { empezarAltaAction, refrescarEstadoAction } from '@/modules/payments/actions';
import { estadoGuardado } from '@/modules/payments/connect';
import { miPerfil } from '@/modules/profiles/queries';

export const metadata: Metadata = { title: 'Cobros · TuGameMaster' };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function CobrosPage({ searchParams }: Props) {
  const params = await searchParams;

  const session = await auth();
  if (!session?.user) redirect('/login');

  const perfil = await miPerfil(session.user.id);
  if (!perfil) redirect('/login');
  if (!perfil.gmProfile) redirect('/cuenta/gm');

  const cuenta = await estadoGuardado(session.user.id);
  const empezado = Boolean(cuenta?.stripeAccountId);
  const listo = cuenta?.payoutsEnabled === true;

  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <Link
        href="/cuenta/gm"
        className="text-sm text-slate-500 hover:underline dark:text-slate-400"
      >
        ← Perfil de game master
      </Link>

      <h1 className="mt-4 text-2xl font-semibold text-slate-900 dark:text-slate-50">
        Dónde recibes tus pagos
      </h1>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
        Necesario para poder publicar partidas.
      </p>

      {!stripeEnabled() ? (
        <p className="mt-8 rounded-xl border border-slate-200 p-5 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-400">
          Los cobros no están configurados en este entorno.
        </p>
      ) : (
        <>
          {params['vuelta'] !== undefined && !listo && (
            <p className="mt-6 rounded-lg bg-slate-100 px-4 py-3 text-sm text-slate-700 dark:bg-slate-800 dark:text-slate-300">
              Stripe todavía está revisando tus datos. Puede tardar un rato, y a veces
              algún día. Pulsa «Comprobar estado» más tarde.
            </p>
          )}

          <section
            className={`mt-6 rounded-xl border p-5 ${
              listo
                ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/40'
                : 'border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/40'
            }`}
          >
            <p
              className={`font-medium ${
                listo
                  ? 'text-emerald-900 dark:text-emerald-200'
                  : 'text-amber-900 dark:text-amber-200'
              }`}
            >
              {listo
                ? 'Cuenta verificada'
                : empezado
                  ? 'Alta empezada, sin terminar'
                  : 'Alta sin empezar'}
            </p>

            <p
              className={`mt-1 text-sm ${
                listo
                  ? 'text-emerald-800/80 dark:text-emerald-300/80'
                  : 'text-amber-800/80 dark:text-amber-300/80'
              }`}
            >
              {listo
                ? 'Ya puedes publicar partidas y recibir pagos.'
                : 'Hasta que Stripe verifique tus datos no podrás publicar partidas.'}
            </p>
          </section>

          <div className="mt-6 flex flex-wrap gap-3">
            {!listo && (
              <ReservarBoton
                accion={empezarAltaAction}
                texto={empezado ? 'Continuar con el alta' : 'Empezar el alta'}
                campos={{}}
              />
            )}

            {empezado && (
              <ReservarBoton
                accion={refrescarEstadoAction}
                texto="Comprobar estado"
                destructivo
                campos={{}}
              />
            )}
          </div>

          <section className="mt-10 space-y-3 text-sm text-slate-600 dark:text-slate-400">
            <h2 className="font-medium text-slate-900 dark:text-slate-100">
              Qué va a pasar
            </h2>
            <p>
              El alta la gestiona <strong>Stripe</strong>, no nosotros. Te pedirá tus
              datos fiscales y un documento de identidad. TuGameMaster no llega a ver ni a
              guardar esos datos.
            </p>
            <p>
              Cuando empiecen los cobros, el jugador pagará al reservar y tú recibirás tu
              parte <strong>48 horas después de terminar la partida</strong>, si no hay
              incidencias. De cada reserva se descuenta la comisión del 5% de TuGameMaster
              y el coste que cobra Stripe por la transacción.
            </p>
          </section>
        </>
      )}
    </main>
  );
}
