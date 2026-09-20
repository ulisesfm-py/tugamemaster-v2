import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { PerfilGmForm } from '@/components/perfil-form';
import { Aviso, EnlaceBoton, Estado } from '@/components/ui';
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
    <main className="mx-auto max-w-2xl px-4 py-10">
      <Link href="/cuenta" className="text-muted-foreground text-sm hover:underline">
        ← Mi perfil
      </Link>

      <h1 className="font-heading text-foreground mt-4 text-3xl font-extrabold sm:text-4xl">
        {gm ? 'Perfil de game master' : 'Empezar a dirigir'}
      </h1>

      <p className="text-muted-foreground mt-2">
        {gm ? (
          <>
            Público en{' '}
            <Link href={`/gm/${perfil.slug}`} className="text-primary hover:underline">
              /gm/{perfil.slug}
            </Link>
          </>
        ) : (
          'Con este perfil te presentas a quien busca mesa. Puedes cambiarlo cuando quieras.'
        )}
      </p>

      {/* Crear el perfil convierte al usuario en GM, pero publicar partidas
          exige ademas completar el alta de cobro. Se avisa desde el principio
          para que nadie rellene esto esperando poder publicar ya. */}
      {gm?.payoutsEnabled ? (
        <p className="border-border text-muted-foreground mt-6 flex flex-wrap items-center gap-2 rounded-sm border border-dashed px-4 py-2.5 text-sm">
          <Estado tono="bien">Cuenta verificada</Estado>
          Ya puedes publicar partidas y recibir transferencias.
        </p>
      ) : (
        <Aviso tono="atencion" className="mt-6" titulo="Esto no basta para publicar">
          Con este perfil ya eres game master, pero para <strong>publicar</strong>{' '}
          partidas tienes que configurar antes dónde recibir los pagos.{' '}
          {gm ? '' : 'Podrás hacerlo en cuanto guardes este perfil.'}
        </Aviso>
      )}

      {gm && !gm.payoutsEnabled && (
        <div className="mt-4">
          <EnlaceBoton href="/cuenta/cobros" variante="perfil">
            Configurar cobros
          </EnlaceBoton>
        </div>
      )}

      <section className="mt-8">
        <PerfilGmForm
          accion={guardarPerfilGmAction}
          valores={
            gm
              ? {
                  headline: gm.headline ?? '',
                  about: gm.about,
                  languages: gm.languages,
                  yearsExperience: gm.yearsExperience,
                  systems: gm.systems,
                }
              : null
          }
        />
      </section>

      {gm && (
        <section className="border-border mt-12 rounded-sm border border-dashed p-5">
          <h2 className="font-heading text-foreground text-base font-bold">
            Tus mesas y tu dinero
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Esta página es solo cómo te presentas. Lo que diriges y lo que ganas está
            aparte.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <EnlaceBoton href="/cuenta/partidas" variante="perfil" tamano="sm">
              Mis partidas
            </EnlaceBoton>
            <EnlaceBoton href="/cuenta/cobros" variante="perfil" tamano="sm">
              Mis ingresos
            </EnlaceBoton>
          </div>
        </section>
      )}
    </main>
  );
}
