import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

import { Hilo } from '@/components/hilo/hilo';
import { VaciarHilo } from '@/components/hilo/vaciar-hilo';
import { EnlaceBoton, Fecha } from '@/components/ui';
import { auth } from '@/lib/auth';
import { cierreDelHilo, TEXTO_HILO } from '@/modules/threads/politica';
import { hiloDePartida } from '@/modules/threads/queries';

type Props = { params: Promise<{ slug: string }> };

/**
 * El hilo de una partida.
 *
 * Es privado, asi que no lleva metadatos que lo describan ni se indexa: lo que
 * se habla en una mesa es de quienes estan en ella.
 *
 * Quien no pertenece a la mesa ve un 404, no un «no autorizado»: decir que el
 * hilo existe ya es contar algo de una partida que no es suya. La excepcion
 * son los casos que se explican solos y se arreglan solos —el cobro sin
 * confirmar, la plaza liberada, el hilo cerrado—, donde callarse seria dejar
 * a alguien de la mesa delante de una pared.
 */
export const metadata: Metadata = {
  title: 'Hilo de la partida · TuGameMaster',
  robots: { index: false, follow: false },
};

export default async function HiloPage({ params }: Props) {
  const { slug } = await params;
  const session = await auth();

  if (!session?.user) redirect('/login');

  const resultado = await hiloDePartida(slug, session.user.id);

  if (!resultado.ok) {
    if (!resultado.existe) notFound();

    return (
      // El motivo va bajo un encabezado de verdad y no dentro de un aviso:
      // una pagina entera cuyo unico contenido es un parrafo suelto deja a
      // quien navega con lector de pantalla sin nada a lo que saltar.
      <main className="mx-auto max-w-2xl px-4 py-12">
        <h1 className="font-heading text-foreground text-2xl font-extrabold text-balance">
          Aquí no puedes entrar
        </h1>

        <p className="text-muted-foreground mt-3 text-sm">{resultado.mensaje}</p>

        <EnlaceBoton href={`/partidas/${slug}`} variante="perfil" className="mt-6">
          Volver a la partida
        </EnlaceBoton>
      </main>
    );
  }

  const { partida, esGm, mensajes } = resultado.hilo;

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <p className="text-muted-foreground text-sm">
        <Link href={`/partidas/${partida.slug}`} className="text-primary hover:underline">
          {partida.title}
        </Link>
      </p>

      <h1 className="font-heading text-foreground mt-2 text-3xl font-extrabold text-balance">
        Hilo de mesa
      </h1>

      <p className="text-muted-foreground mt-2 text-sm">
        {esGm ? 'Tu mesa' : `Dirige ${partida.gm.name}`} ·{' '}
        <Fecha valor={partida.startsAt} />
      </p>

      <div className="mt-8">
        <Hilo gameId={partida.id} slug={partida.slug} mensajes={mensajes} />
      </div>

      <section className="border-border mt-10 rounded-sm border border-dashed p-4">
        <h2 className="text-foreground text-sm font-semibold">Cómo funciona este hilo</h2>
        <ul className="text-muted-foreground mt-2 flex flex-col gap-1.5 text-xs">
          {TEXTO_HILO.detalle.map((linea) => (
            <li key={linea}>{linea}</li>
          ))}
        </ul>
        {/* La fecha exacta, no una cuenta atras: un plazo redondeado miente
            justo cuando alguien necesita saber si le da tiempo. */}
        <p className="text-muted-foreground mt-3 text-xs">
          Este hilo se cierra el <Fecha valor={cierreDelHilo(partida.endsAt)} />.
        </p>
      </section>

      {esGm && (
        <div className="mt-6">
          <VaciarHilo gameId={partida.id} slug={partida.slug} />
        </div>
      )}
    </main>
  );
}
