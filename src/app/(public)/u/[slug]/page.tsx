import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { Avatar, EnlaceBoton, Etiqueta, Fecha, Vacio } from '@/components/ui';
import { perfilPublicoUsuario } from '@/modules/profiles/queries';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const perfil = await perfilPublicoUsuario(slug);

  return {
    title: perfil ? `${perfil.user.name} · TuGameMaster` : 'Perfil no encontrado',
  };
}

/** Un par de etiquetas con su rótulo. */
function Gustos({ titulo, valores }: { titulo: string; valores: string[] }) {
  if (valores.length === 0) return null;

  return (
    <section className="mt-6">
      <h2 className="text-muted-foreground text-xs font-semibold tracking-widest uppercase">
        {titulo}
      </h2>
      <div className="mt-2 flex flex-wrap gap-2">
        {valores.map((v) => (
          <Etiqueta key={v}>{v}</Etiqueta>
        ))}
      </div>
    </section>
  );
}

export default async function UsuarioPage({ params }: Props) {
  const { slug } = await params;
  const perfil = await perfilPublicoUsuario(slug);

  if (!perfil) notFound();

  const { user, partidasJugadas, historial, esGm } = perfil;

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <header className="flex flex-wrap items-start gap-5">
        <Avatar src={user.image} nombre={user.name} tamano={80} />

        <div className="min-w-0 flex-1">
          <h1 className="font-heading text-foreground text-3xl font-extrabold">
            {user.name}
          </h1>

          <p className="text-muted-foreground mt-1.5">
            {partidasJugadas === 0
              ? 'Todavía no ha jugado ninguna partida aquí.'
              : `Ha jugado ${partidasJugadas} ${
                  partidasJugadas === 1 ? 'partida' : 'partidas'
                } a través de la plataforma.`}
          </p>

          {esGm && (
            <div className="mt-4">
              <EnlaceBoton href={`/gm/${user.slug}`} variante="perfil" tamano="sm">
                Ver su perfil de game master
              </EnlaceBoton>
            </div>
          )}
        </div>
      </header>

      {user.bio && (
        <p className="text-muted-foreground mt-8 leading-relaxed whitespace-pre-line">
          {user.bio}
        </p>
      )}

      <Gustos titulo="Sistemas que le gustan" valores={user.preferredSystems} />
      <Gustos titulo="Estilo de juego" valores={user.preferredStyles} />

      <section className="mt-10">
        <h2 className="font-heading text-foreground text-xl font-bold">
          Partidas jugadas
        </h2>

        {historial.length === 0 ? (
          <Vacio className="mt-4" titulo="Aún no ha jugado nada aquí">
            Cuando termine su primera mesa, aparecerá en esta lista.
          </Vacio>
        ) : (
          /* Qué jugó y con quién. Ni precios ni estados de pago: eso es suyo. */
          <ul className="border-border divide-border mt-4 divide-y rounded-sm border">
            {historial.map((p) => (
              <li key={p.id} className="px-4 py-3">
                <Link
                  href={`/partidas/${p.slug}`}
                  className="text-foreground text-sm font-medium hover:underline"
                >
                  {p.title}
                </Link>
                <p className="text-muted-foreground text-xs">
                  {p.system} · <Fecha valor={p.startsAt} /> · dirigida por{' '}
                  <Link href={`/gm/${p.gm.user.slug}`} className="hover:underline">
                    {p.gm.user.name}
                  </Link>
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
