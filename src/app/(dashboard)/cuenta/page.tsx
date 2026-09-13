import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { AvatarForm } from '@/components/avatar-form';
import { PerfilJugadorForm } from '@/components/perfil-form';
import { Avatar } from '@/components/ui';
import { auth } from '@/lib/auth';
import { blobEnabled } from '@/lib/env';
import {
  guardarPerfilJugadorAction,
  quitarAvatarAction,
  subirAvatarAction,
} from '@/modules/profiles/actions';
import { miPerfil } from '@/modules/profiles/queries';

export const metadata: Metadata = { title: 'Mi perfil · TuGameMaster' };

export default async function CuentaPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const perfil = await miPerfil(session.user.id);
  if (!perfil) redirect('/login');

  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
        Mi perfil
      </h1>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
        Así te ven los demás en{' '}
        <Link href={`/u/${perfil.slug}`} className="text-indigo-600 hover:underline">
          /u/{perfil.slug}
        </Link>
      </p>

      <section className="mt-8 rounded-xl border border-slate-200 p-4 dark:border-slate-800">
        <div className="flex items-center gap-4">
          <Avatar src={perfil.image} nombre={perfil.name} tamano={56} />
          <div className="text-sm">
            <p className="font-medium text-slate-900 dark:text-slate-100">
              Foto de perfil
            </p>
            <p className="mt-0.5 text-slate-600 dark:text-slate-400">
              {perfil.image
                ? 'Puedes cambiarla o quitarla.'
                : 'Sin foto se muestra tu inicial.'}
            </p>
          </div>
        </div>

        <div className="mt-4">
          {blobEnabled() ? (
            <AvatarForm
              accionSubir={subirAvatarAction}
              accionQuitar={quitarAvatarAction}
              tieneFoto={perfil.image !== null}
            />
          ) : (
            <p className="text-sm text-slate-600 dark:text-slate-400">
              La subida de fotos no está configurada en este entorno.
            </p>
          )}
        </div>
      </section>

      <section className="mt-8">
        <PerfilJugadorForm
          accion={guardarPerfilJugadorAction}
          valores={{
            name: perfil.name,
            bio: perfil.bio,
            preferredSystems: perfil.preferredSystems,
            preferredStyles: perfil.preferredStyles,
          }}
        />
      </section>

      <section className="mt-12 rounded-xl border border-slate-200 p-5 dark:border-slate-800">
        <h2 className="font-semibold text-slate-900 dark:text-slate-50">
          {perfil.gmProfile ? 'Tu perfil de game master' : '¿Quieres dirigir partidas?'}
        </h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          {perfil.gmProfile
            ? 'Edita cómo te presentas a los jugadores que buscan mesa.'
            : 'Crea tu perfil de game master para poder abrir tus propias mesas.'}
        </p>
        <Link
          href="/cuenta/gm"
          className="mt-4 inline-block rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          {perfil.gmProfile ? 'Editar perfil de GM' : 'Crear perfil de GM'}
        </Link>
      </section>
    </main>
  );
}
