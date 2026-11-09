import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

import { ImagenForm } from '@/components/imagen-form';
import { Lamina } from '@/components/lamina';
import { NotaSesion } from '@/components/nota-sesion';
import { CopiarBoton } from '@/components/copiar-boton';
import { PartidaForm } from '@/components/partida-form';
import { ReservarBoton } from '@/components/reservar-boton';
import {
  Avatar,
  Aviso,
  EnlaceBoton,
  Estado,
  ESTADO_DE_PARTIDA,
  ESTADO_DE_RESERVA,
  Fecha,
  Vacio,
} from '@/components/ui';
import { blobEnabled } from '@/lib/env';
import { auth } from '@/lib/auth';
import { jugadoresDe } from '@/modules/bookings/queries';
import { guardarNotaAction } from '@/modules/campaigns/actions';
import { partidaTerminada } from '@/modules/campaigns/politica';
import {
  actualizarPartidaAction,
  cancelarPartidaAction,
  despublicarPartidaAction,
  publicarPartidaAction,
  subirLaminaAction,
} from '@/modules/games/actions';
import { estadoVisible } from '@/modules/games/ficha';
import { miPartida } from '@/modules/games/queries';
import { accesoAlHilo, DIAS_DE_VIDA } from '@/modules/threads/politica';

export const metadata: Metadata = { title: 'Gestionar partida · TuGameMaster' };

type Props = { params: Promise<{ gameId: string }> };

/** Un bloque de la ficha. */
function Bloque({
  titulo,
  nota,
  children,
}: {
  titulo: string;
  nota?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-10">
      <h2 className="font-heading text-foreground text-xl font-bold">{titulo}</h2>
      {nota && <p className="text-muted-foreground mt-1 text-sm">{nota}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

export default async function GestionarPartidaPage({ params }: Props) {
  const { gameId } = await params;

  const session = await auth();
  if (!session?.user) redirect('/login');

  const partida = await miPartida(session.user.id, gameId);
  if (!partida) notFound();

  const jugadores = (await jugadoresDe(gameId, session.user.id)) ?? [];
  const editable = partida.status === 'DRAFT' || partida.status === 'PUBLISHED';

  // `partidaTerminada` acepta tambien una publicada cuya hora de fin ya paso:
  // el GM puede anotar como acabo nada mas levantarse de la mesa, sin esperar
  // a que el cron la cierre de madrugada.
  const terminada = partidaTerminada(partida.status, partida.endsAt);
  const pagadas = partida._count.bookings;

  const visible = estadoVisible(partida.status, partida.startsAt);

  // El hilo existe mientras la mesa exista. En borrador no se ofrece: no hay
  // con quien hablar hasta que alguien pueda reservar.
  const hiloAbierto =
    partida.status !== 'DRAFT' &&
    accesoAlHilo({ esGm: true, reserva: null }, { finPartida: partida.endsAt }).ok;
  const estado = ESTADO_DE_PARTIDA[visible];

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <Link
        href="/cuenta/partidas"
        className="text-muted-foreground text-sm hover:underline"
      >
        ← Mis partidas
      </Link>

      <div className="mt-4 flex flex-wrap items-start gap-x-3 gap-y-2">
        <h1 className="font-heading text-foreground min-w-0 flex-1 text-3xl font-extrabold text-balance">
          {partida.title}
        </h1>
        <Estado tono={estado.tono} className="mt-1.5">
          {estado.texto}
        </Estado>
      </div>

      <p className="text-muted-foreground mt-2 text-sm">
        {partida.system} · <Fecha valor={partida.startsAt} />
      </p>

      {partida.campaign && (
        <p className="text-muted-foreground mt-1 text-sm">
          Sesión {partida.sessionNumber} de{' '}
          <Link
            href={`/campanas/${partida.campaign.slug}`}
            className="text-primary hover:underline"
          >
            {partida.campaign.title}
          </Link>
        </p>
      )}

      {/* ── Lo primero: en qué punto está y qué se puede hacer ──── */}
      {partida.status === 'DRAFT' && (
        <section className="border-border bg-card mt-6 rounded-sm border p-5">
          <p className="text-foreground font-medium">Todavía no la ve nadie</p>
          <p className="text-muted-foreground mt-1 text-sm">
            Repásala entera y publícala cuando esté lista. Podrás retirarla después si
            hace falta.
          </p>
          <div className="mt-4">
            <ReservarBoton
              accion={publicarPartidaAction}
              texto="Publicar"
              campos={{ gameId: partida.id, slug: partida.slug }}
            />
          </div>
        </section>
      )}

      {partida.status === 'PUBLISHED' && (
        <p className="border-border text-muted-foreground mt-6 flex flex-wrap items-center gap-2 rounded-sm border border-dashed px-4 py-2.5 text-sm">
          Está publicada y admite reservas.{' '}
          <Link
            href={`/partidas/${partida.slug}`}
            className="text-primary hover:underline"
          >
            Verla como la ven los jugadores
          </Link>
        </p>
      )}

      {partida.status === 'CANCELLED' && (
        <Aviso tono="error" className="mt-6" titulo="Partida cancelada">
          Quien había pagado su plaza recibió el importe íntegro en saldo.
        </Aviso>
      )}

      {/* ── Lo urgente cuando ya se ha jugado ───────────────────── */}
      {terminada && (
        <Bloque
          titulo="Cómo acabó la sesión"
          nota="Te servirá de plantilla para montar la siguiente, y a tus jugadores para recordar dónde se quedaron."
        >
          <NotaSesion
            gameId={partida.id}
            accion={guardarNotaAction}
            contenido={partida.sessionNote?.content ?? null}
          />

          <div className="border-border mt-6 rounded-sm border p-4">
            {partida.nextGame ? (
              <p className="text-muted-foreground text-sm">
                Ya has creado la continuación:{' '}
                <Link
                  href={`/cuenta/partidas/${partida.nextGame.id}`}
                  className="text-primary hover:underline"
                >
                  {partida.nextGame.title}
                </Link>
              </p>
            ) : (
              <>
                <p className="text-foreground text-sm font-medium">
                  ¿Seguís la historia otro día?
                </p>
                <p className="text-muted-foreground mt-1 text-sm">
                  La siguiente sesión solo la podrán reservar quienes jugaron esta, y
                  nacerá con la ficha de esta ya rellenada.
                </p>
                <div className="mt-4">
                  <EnlaceBoton href={`/cuenta/partidas/${partida.id}/continuacion`}>
                    Crear la siguiente sesión
                  </EnlaceBoton>
                </div>
              </>
            )}
          </div>
        </Bloque>
      )}

      {/* ── Hablar con la mesa ──────────────────────────────────── */}
      {hiloAbierto && (
        <Bloque
          titulo="Hilo de mesa"
          nota={`Donde hablas con quien tiene plaza. Se cierra ${DIAS_DE_VIDA} días después de la partida y no manda correos: los avisos van a la campana.`}
        >
          <EnlaceBoton href={`/partidas/${partida.slug}/hilo`} variante="perfil">
            Abrir el hilo
          </EnlaceBoton>
        </Bloque>
      )}

      {/* ── La contrasena de una privada ───────────────────────── */}
      {partida.visibility === 'PRIVADA' && partida.accessPassword && (
        <Bloque
          titulo="Partida privada"
          nota={
            partida.previousGameId
              ? 'Es una continuación: solo pueden reservar quienes jugaron la sesión anterior, y a ellos no se les pide la contraseña.'
              : 'Sale en el listado con la etiqueta «Privada». Para reservar hay que escribir esta contraseña: pásasela a tus jugadores.'
          }
        >
          <div className="flex flex-wrap items-center gap-3">
            <code className="bg-secondary text-foreground rounded-sm px-3 py-1.5 font-mono text-lg">
              {partida.accessPassword}
            </code>
            <CopiarBoton texto={partida.accessPassword} etiqueta="Copiar contraseña" />
          </div>
          <p className="text-muted-foreground mt-2 text-xs">
            Puedes cambiarla en «Editar». Quien ya tiene plaza la conserva.
          </p>
        </Bloque>
      )}

      {/* ── Quién viene ─────────────────────────────────────────── */}
      <Bloque titulo={`Jugadores (${jugadores.length} de ${partida.seatsTotal})`}>
        {jugadores.length === 0 ? (
          <Vacio titulo="Todavía no se ha apuntado nadie">
            {partida.status === 'DRAFT'
              ? 'Nadie puede reservar mientras siga en borrador.'
              : 'Cuando alguien reserve su plaza, aparecerá aquí.'}
          </Vacio>
        ) : (
          <ul className="border-border divide-border divide-y rounded-sm border">
            {jugadores.map((j) => (
              <li key={j.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <Avatar src={j.user.image} nombre={j.user.name} tamano={32} />
                <Link
                  href={`/u/${j.user.slug}`}
                  className="text-foreground text-sm font-medium hover:underline"
                >
                  {j.user.name}
                </Link>

                {/* El estado importa: una reserva sin pagar todavia ocupa
                    plaza, pero puede caerse sola al vencer el plazo. */}
                <Estado tono={ESTADO_DE_RESERVA[j.status].tono}>
                  {ESTADO_DE_RESERVA[j.status].texto}
                </Estado>

                <span className="text-muted-foreground ml-auto text-xs">
                  <Fecha valor={j.createdAt} />
                </span>
              </li>
            ))}
          </ul>
        )}
      </Bloque>

      {editable && (
        <>
          <Bloque
            titulo="Lámina"
            nota="Es lo primero que se ve de tu partida en el portal."
          >
            {/* Se ensena siempre, tenga imagen o no: es la unica forma de
                saber si ya se subio una. Con el formulario solo, quien volvia
                a entrar no tenia manera de distinguir «no tiene» de «si tiene
                y no se ve aqui». Y sin imagen propia se ve la compuesta, que
                es justo lo que estan viendo los jugadores. */}
            <figure>
              <div className="from-accent/20 to-background relative grid aspect-[16/9] place-items-center overflow-hidden rounded-sm bg-gradient-to-br sm:aspect-[3/1]">
                <Lamina
                  src={partida.imageUrl}
                  system={partida.system}
                  sizes="(max-width: 672px) 100vw, 42rem"
                  claseTexto="text-2xl sm:text-4xl"
                />
              </div>

              <figcaption className="text-muted-foreground mt-2 text-sm">
                {partida.imageUrl
                  ? 'Tu lámina, tal como se ve en el portal.'
                  : 'Sin imagen propia se compone esta con el nombre del sistema. Cumple, pero no llama.'}
              </figcaption>
            </figure>

            <div className="mt-4">
              {blobEnabled() ? (
                <ImagenForm
                  accion={subirLaminaAction}
                  campo="lamina"
                  campos={{ gameId: partida.id, slug: partida.slug }}
                  textoBoton={partida.imageUrl ? 'Cambiar lámina' : 'Subir lámina'}
                />
              ) : (
                <Aviso tono="dato">
                  La subida de imágenes no está configurada en este entorno.
                </Aviso>
              )}
            </div>
          </Bloque>

          <Bloque titulo="Editar">
            <PartidaForm
              accion={actualizarPartidaAction}
              textoBoton="Guardar cambios"
              valores={partida}
            />
          </Bloque>

          {/* ── Lo que no tiene vuelta atrás, al final y aparte ─────
              Antes «Cancelar partida» compartia caja con «Publicar», a un
              dedo de distancia. Una accion que devuelve el dinero de
              todo el mundo no puede estar donde se pulsa sin mirar. */}
          {/* Con nombre accesible, asi que es una region de verdad y se puede
              saltar a ella desde un lector de pantalla. Un <section> sin
              nombre no es mas que un div con otra etiqueta. */}
          <section
            aria-labelledby="zona-de-riesgo"
            className="border-destructive/30 mt-12 rounded-sm border border-dashed p-5"
          >
            <h2
              id="zona-de-riesgo"
              className="font-heading text-foreground text-base font-bold"
            >
              {partida.status === 'PUBLISHED' ? 'Retirar o cancelar' : 'Cancelar'}
            </h2>

            <div className="mt-4 flex flex-col gap-5">
              {partida.status === 'PUBLISHED' && (
                <div>
                  <ReservarBoton
                    accion={despublicarPartidaAction}
                    texto="Retirar del portal"
                    destructivo
                    tamano="sm"
                    campos={{ gameId: partida.id, slug: partida.slug }}
                  />
                  <p className="text-muted-foreground mt-2 text-xs">
                    Vuelve a borrador y deja de admitir reservas. Quien ya tenga plaza la
                    conserva.
                  </p>
                </div>
              )}

              <div>
                <ReservarBoton
                  accion={cancelarPartidaAction}
                  texto="Cancelar partida"
                  destructivo
                  tamano="sm"
                  campos={{ gameId: partida.id, slug: partida.slug }}
                />
                <p className="text-muted-foreground mt-2 text-xs">
                  {pagadas > 0 ? (
                    <>
                      Se devolverá el 100% en saldo a {pagadas}{' '}
                      {pagadas === 1 ? 'jugador' : 'jugadores'}. No se puede deshacer.
                    </>
                  ) : (
                    'La partida queda cancelada para siempre. No se puede deshacer.'
                  )}
                </p>
              </div>
            </div>
          </section>
        </>
      )}
    </main>
  );
}
