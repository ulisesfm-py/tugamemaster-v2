import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { PartidaForm } from '@/components/partida-form';
import { auth } from '@/lib/auth';
import { crearPartidaAction } from '@/modules/games/actions';
import { miPerfil } from '@/modules/profiles/queries';

export const metadata: Metadata = { title: 'Nueva partida · TuGameMaster' };

export default async function NuevaPartidaPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const perfil = await miPerfil(session.user.id);

  // Sin perfil de GM no hay nada que hacer aquí: se envía a crearlo primero.
  if (!perfil?.gmProfile) redirect('/cuenta/gm');

  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <Link
        href="/cuenta/partidas"
        className="text-sm text-slate-500 hover:underline dark:text-slate-400"
      >
        ← Mis partidas
      </Link>

      <h1 className="mt-4 text-2xl font-semibold text-slate-900 dark:text-slate-50">
        Nueva partida
      </h1>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
        Se guardará como borrador. Podrás publicarla cuando quieras.
      </p>

      <div className="mt-8">
        <PartidaForm
          accion={crearPartidaAction}
          textoBoton="Crear borrador"
          idiomasPorDefecto={perfil.gmProfile.languages}
        />
      </div>
    </main>
  );
}
