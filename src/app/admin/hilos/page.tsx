import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { ReservarBoton } from '@/components/reservar-boton';
import { Fecha, Vacio } from '@/components/ui';
import { auth } from '@/lib/auth';
import { descartarDenunciaAction, retirarMensajeAction } from '@/modules/threads/actions';
import { denunciasParaAdmin } from '@/modules/threads/queries';

export const metadata: Metadata = { title: 'Mensajes denunciados · Admin' };

/**
 * Mensajes denunciados en los hilos de mesa.
 *
 * Es el cauce de moderacion completo: el game master no puede expulsar a nadie
 * de su mesa —sacar de ahi a quien ha pagado es quitarle algo que compro—, asi
 * que denuncia como todo el mundo y decide quien si puede devolver el dinero.
 */
export default async function HilosPage() {
  const session = await auth();

  // El middleware ya bloquea /admin, pero se repite aqui: la seguridad no
  // puede depender de una sola capa.
  if (!session?.user?.isAdmin) notFound();

  const denuncias = await denunciasParaAdmin();

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <Link href="/admin" className="text-muted-foreground text-sm hover:underline">
        ← Administración
      </Link>

      <h1 className="font-heading text-foreground mt-4 text-3xl font-extrabold sm:text-4xl">
        Mensajes denunciados
      </h1>
      <p className="text-muted-foreground mt-2">
        {denuncias.length === 0
          ? 'No hay ninguno pendiente.'
          : `${denuncias.length} sin revisar, del más antiguo al más reciente.`}
      </p>

      {denuncias.length === 0 ? (
        <Vacio className="mt-8" titulo="Nadie ha denunciado nada">
          Aparecerán aquí los mensajes de los hilos de mesa que alguien marque.
        </Vacio>
      ) : (
        <ul className="mt-8 flex flex-col gap-5">
          {denuncias.map((d) => (
            <li key={d.id} className="border-border bg-card rounded-sm border p-5">
              <p className="text-muted-foreground text-sm">
                En{' '}
                <Link
                  href={`/partidas/${d.game.slug}`}
                  className="text-primary hover:underline"
                >
                  {d.game.title}
                </Link>
              </p>

              {/* El mensaje tal cual se escribio. Es texto plano y se pinta
                  como tal: aqui tampoco se interpreta nada. */}
              <div className="bg-secondary mt-3 rounded-sm p-4">
                <p className="text-muted-foreground text-xs">
                  <Link
                    href={`/u/${d.author.slug}`}
                    className="text-primary hover:underline"
                  >
                    {d.author.name}
                  </Link>{' '}
                  · <Fecha valor={d.createdAt} />
                </p>
                <p className="text-foreground mt-2 text-sm whitespace-pre-line">
                  {d.body}
                </p>
              </div>

              <p className="text-muted-foreground mt-3 text-sm">
                Lo denuncia{' '}
                <Link
                  href={`/u/${d.reportedBy?.slug ?? ''}`}
                  className="text-primary hover:underline"
                >
                  {d.reportedBy?.name ?? 'alguien'}
                </Link>
                {d.reportedAt && (
                  <>
                    {' · '}
                    <Fecha valor={d.reportedAt} />
                  </>
                )}
                : <span className="text-foreground">{d.reportReason}</span>
              </p>

              <div className="border-border mt-4 flex flex-wrap gap-3 border-t pt-4">
                <ReservarBoton
                  accion={retirarMensajeAction}
                  texto="Retirar el mensaje"
                  destructivo
                  tamano="sm"
                  campos={{ messageId: d.id, slug: d.game.slug }}
                />

                <ReservarBoton
                  accion={descartarDenunciaAction}
                  texto="Dejarlo como está"
                  tamano="sm"
                  campos={{ messageId: d.id }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
