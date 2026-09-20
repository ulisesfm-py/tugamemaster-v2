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
    <main className="mx-auto max-w-2xl px-4 py-10">
      <Link
        href="/cuenta/partidas"
        className="text-muted-foreground text-sm hover:underline"
      >
        ← Mis partidas
      </Link>

      <h1 className="font-heading text-foreground mt-4 text-3xl font-extrabold">
        Nueva partida
      </h1>
      <p className="text-muted-foreground mt-2">
        Nace como borrador: podrás revisarla entera antes de que la vea nadie.
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
