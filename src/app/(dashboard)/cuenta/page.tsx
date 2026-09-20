import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { AvatarForm } from '@/components/avatar-form';
import { PerfilJugadorForm } from '@/components/perfil-form';
import { Avatar, Aviso, EnlaceBoton } from '@/components/ui';
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
    <main className="mx-auto max-w-2xl px-4 py-10">
      <Link href="/dashboard" className="text-muted-foreground text-sm hover:underline">
        ← Mi cuenta
      </Link>

      <h1 className="font-heading text-foreground mt-4 text-3xl font-extrabold sm:text-4xl">
        Mi perfil
      </h1>
      <p className="text-muted-foreground mt-2">
        Así te ven los demás.{' '}
        <Link href={`/u/${perfil.slug}`} className="text-primary hover:underline">
          Ver mi perfil público
        </Link>
      </p>

      <section className="border-border bg-card mt-8 rounded-sm border p-5">
        <div className="flex items-center gap-4">
          <Avatar src={perfil.image} nombre={perfil.name} tamano={56} />
          <div>
            <p className="text-foreground text-sm font-medium">Foto de perfil</p>
            <p className="text-muted-foreground mt-0.5 text-sm">
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
            <Aviso tono="dato">
              La subida de fotos no está configurada en este entorno.
            </Aviso>
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

      {/* El perfil de game master es otra cosa y vive en otra pagina: aqui
          solo la puerta. El saldo se fue de esta pantalla a proposito —esta en
          la cabecera y en el panel, y no es un dato del perfil. */}
      <section className="border-border mt-12 rounded-sm border border-dashed p-5">
        <h2 className="font-heading text-foreground text-base font-bold">
          {perfil.gmProfile ? 'Tu perfil de game master' : '¿Quieres dirigir partidas?'}
        </h2>
        <p className="text-muted-foreground mt-1 text-sm">
          {perfil.gmProfile
            ? 'Cómo te presentas a los jugadores que buscan mesa.'
            : 'Crea tu perfil de game master y podrás abrir tus propias mesas.'}
        </p>
        <div className="mt-4">
          <EnlaceBoton href="/cuenta/gm" variante="perfil">
            {perfil.gmProfile ? 'Editar perfil de GM' : 'Crear perfil de GM'}
          </EnlaceBoton>
        </div>
      </section>
    </main>
  );
}
