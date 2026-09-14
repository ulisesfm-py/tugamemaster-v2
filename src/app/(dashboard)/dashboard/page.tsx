import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { auth } from '@/lib/auth';
import { salirAction } from '@/modules/users/actions';

export const metadata: Metadata = { title: 'Mi cuenta · TuGameMaster' };

export default async function DashboardPage() {
  const session = await auth();

  // El middleware ya bloquea esta ruta, pero la comprobacion se repite aqui:
  // la seguridad no puede depender de una sola capa, y ademas es lo que hace
  // que TypeScript sepa que `session` existe a partir de esta linea.
  if (!session?.user) redirect('/login');

  const { user } = session;

  return (
    <main className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
        Hola, {user.name}
      </h1>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
        Has entrado correctamente. Aquí irá tu panel.
      </p>

      <dl className="mt-8 divide-y divide-slate-200 rounded-xl border border-slate-200 text-sm dark:divide-slate-800 dark:border-slate-800">
        {[
          ['Email', user.email],
          ['Perfil público', `/u/${user.slug}`],
          ['Administrador', user.isAdmin ? 'Sí' : 'No'],
        ].map(([etiqueta, valor]) => (
          <div key={etiqueta} className="flex justify-between gap-4 px-4 py-3">
            <dt className="text-slate-500 dark:text-slate-400">{etiqueta}</dt>
            <dd className="text-right font-medium text-slate-900 dark:text-slate-100">
              {valor}
            </dd>
          </div>
        ))}
      </dl>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/cuenta"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500"
        >
          Editar mi perfil
        </Link>
        <Link
          href="/mis-reservas"
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          Mis reservas
        </Link>
        <Link
          href="/cuenta/partidas"
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          Mis partidas (GM)
        </Link>
        <Link
          href={`/u/${user.slug}`}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          Ver mi perfil público
        </Link>
      </div>

      {user.isAdmin && (
        <div className="mt-8 rounded-xl border border-indigo-200 p-4 dark:border-indigo-900">
          <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
            Administración
          </p>
          <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1">
            <Link
              href="/admin/incidencias"
              className="text-sm text-indigo-600 hover:underline"
            >
              Revisar incidencias →
            </Link>
            <Link href="/admin/blog" className="text-sm text-indigo-600 hover:underline">
              Escribir en el blog →
            </Link>
          </div>
        </div>
      )}

      <form action={salirAction} className="mt-8">
        <button
          type="submit"
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          Cerrar sesión
        </button>
      </form>
    </main>
  );
}
