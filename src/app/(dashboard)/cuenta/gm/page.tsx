import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { PerfilGmForm } from '@/components/perfil-form';
import { auth } from '@/lib/auth';
import { guardarPerfilGmAction } from '@/modules/profiles/actions';
import { miPerfil } from '@/modules/profiles/queries';

export const metadata: Metadata = { title: 'Perfil de game master · TuGameMaster' };

export default async function CuentaGmPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const perfil = await miPerfil(session.user.id);
  if (!perfil) redirect('/login');

  const gm = perfil.gmProfile;

  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <Link
        href="/cuenta"
        className="text-sm text-slate-500 hover:underline dark:text-slate-400"
      >
        ← Mi perfil
      </Link>

      <h1 className="mt-4 text-2xl font-semibold text-slate-900 dark:text-slate-50">
        {gm ? 'Perfil de game master' : 'Crear perfil de game master'}
      </h1>

      {gm && (
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Público en{' '}
          <Link href={`/gm/${perfil.slug}`} className="text-indigo-600 hover:underline">
            /gm/{perfil.slug}
          </Link>
        </p>
      )}

      {/* Crear el perfil convierte al usuario en GM, pero publicar partidas
          exige ademas completar el alta de cobro. Se avisa desde el principio
          para que nadie rellene esto esperando poder publicar ya. */}
      <section
        className={`mt-6 rounded-xl border p-4 text-sm ${
          gm?.payoutsEnabled
            ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300'
            : 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200'
        }`}
      >
        {gm?.payoutsEnabled ? (
          <p>Tu cuenta de cobro está verificada. Puedes publicar partidas.</p>
        ) : (
          <p>
            Para <strong>publicar</strong> partidas tendrás que configurar antes la cuenta
            donde recibir los pagos. Ese paso todavía no está disponible; llegará en la
            fase de pagos. Mientras tanto puedes preparar tu perfil.
          </p>
        )}
      </section>

      <section className="mt-8">
        <PerfilGmForm
          accion={guardarPerfilGmAction}
          valores={
            gm
              ? { headline: gm.headline ?? '', about: gm.about, languages: gm.languages }
              : null
          }
        />
      </section>
    </main>
  );
}
