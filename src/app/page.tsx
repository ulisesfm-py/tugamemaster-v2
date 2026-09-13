import Link from 'next/link';

import { auth } from '@/lib/auth';

export default async function Home() {
  const session = await auth();

  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col justify-center px-4 py-16">
      <h1 className="text-4xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
        TuGameMaster
      </h1>
      <p className="mt-3 max-w-prose text-slate-600 dark:text-slate-400">
        Reserva tu sitio en partidas de rol dirigidas por game masters, o abre tu propia
        mesa y cobra por dirigirla.
      </p>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/partidas"
          className="rounded-lg bg-indigo-600 px-4 py-2.5 font-medium text-white transition hover:bg-indigo-500"
        >
          Ver partidas
        </Link>
        {session?.user ? (
          <>
            <Link
              href="/dashboard"
              className="rounded-lg border border-slate-300 px-4 py-2.5 font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Ir a mi cuenta
            </Link>
            <span className="self-center text-sm text-slate-500 dark:text-slate-400">
              Sesión iniciada como {session.user.email}
            </span>
          </>
        ) : (
          <>
            <Link
              href="/registro"
              className="rounded-lg border border-slate-300 px-4 py-2.5 font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Crear cuenta
            </Link>
            <Link
              href="/login"
              className="rounded-lg border border-slate-300 px-4 py-2.5 font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Entrar
            </Link>
          </>
        )}
      </div>

      <p className="mt-12 text-xs text-slate-400 dark:text-slate-600">
        Fase 4 de 11 — portal de partidas y reservas. Los pagos llegan en la fase 6.
      </p>
    </main>
  );
}
