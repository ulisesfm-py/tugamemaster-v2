import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { Cascaron } from '@/components/cascaron/cascaron';
import { EnlaceBoton } from '@/components/ui';
import { auth } from '@/lib/auth';
import { buscarCodigo } from '@/modules/invitaciones/service';

export const metadata: Metadata = { title: 'Invitación · TuGameMaster' };

type Props = { params: Promise<{ codigo: string }> };

/**
 * El enlace de un game master fundador: `tugamemaster.com/r/K7M2QX9A`.
 *
 * Sin sesion, lleva a crear la cuenta con el codigo ya puesto. Aqui no se
 * guarda nada: el emparejamiento se hace al registrarse, en el servidor, y no
 * depende de este navegador.
 *
 * Con sesion no hay nada que hacer, porque el codigo solo sirve para una
 * cuenta nueva. Se dice asi, en vez de mandar a un registro que no le toca.
 */
export default async function InvitacionPage({ params }: Props) {
  const { codigo } = await params;
  const session = await auth();

  if (!session?.user) {
    redirect(`/registro?codigo=${encodeURIComponent(codigo)}`);
  }

  const invitacion = await buscarCodigo(codigo);

  return (
    <Cascaron>
      <main className="mx-auto max-w-xl px-4 py-16">
        <h1 className="font-heading text-foreground text-3xl font-extrabold text-balance">
          Ya tienes una cuenta
        </h1>
        <p className="text-muted-foreground mt-3">
          {invitacion.ok ? (
            <>
              Este enlace es una invitación de{' '}
              <strong className="text-foreground">{invitacion.nombre}</strong>, y su
              código solo sirve al crear una cuenta nueva. Puedes reservar en sus partidas
              igual que en cualquier otra.
            </>
          ) : (
            <>Los códigos de invitación solo sirven al crear una cuenta nueva.</>
          )}
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          {invitacion.ok && (
            <EnlaceBoton href={`/u/${invitacion.slug}`}>
              Ver a {invitacion.nombre}
            </EnlaceBoton>
          )}
          <EnlaceBoton href="/partidas" variante="perfil">
            Ver partidas
          </EnlaceBoton>
        </div>

        <p className="text-muted-foreground mt-8 text-sm">
          <Link href="/dashboard" className="text-primary hover:underline">
            Ir a mi cuenta
          </Link>
        </p>
      </main>
    </Cascaron>
  );
}
