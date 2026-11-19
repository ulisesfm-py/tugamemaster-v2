import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

import { ConvocarForm } from '@/components/convocar-form';
import { ConvocatoriaForm } from '@/components/convocatoria-form';
import { ImagenForm } from '@/components/imagen-form';
import { Lamina } from '@/components/lamina';
import { ReservarBoton } from '@/components/reservar-boton';
import {
  Avatar,
  Aviso,
  Estado,
  ESTADO_DE_CONVOCATORIA,
  Fecha,
  Precio,
  Vacio,
} from '@/components/ui';
import { auth } from '@/lib/auth';
import { blobEnabled } from '@/lib/env';
import { paraCampoDeFecha } from '@/lib/hora';
import {
  cerrarConvocatoriaAction,
  convocarMesaAction,
  publicarConvocatoriaAction,
  retirarConvocatoriaAction,
  actualizarConvocatoriaAction,
  subirLaminaDeConvocatoriaAction,
} from '@/modules/convocatorias/actions';
import {
  alcanzaElMinimo,
  describirFranja,
  HORAS_PARA_RESERVAR,
  primeraFechaPosible,
} from '@/modules/convocatorias/politica';
import { miConvocatoria } from '@/modules/convocatorias/queries';

export const metadata: Metadata = { title: 'Gestionar mesa flexible · TuGameMaster' };

type Props = { params: Promise<{ id: string }> };

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

/**
 * La mesa con fecha flexible, vista por su game master.
 *
 * Se crea, se edita, se publica, se retira, se cierra y, al llegar al
 * minimo, se convoca: el GM fija la fecha y nace la partida.
 */

/**
 * Una fecha en el formato de `datetime-local`, redondeada a la hora siguiente
 * y en hora peninsular, que es como el servidor leera lo que se escriba.
 */
function paraCampo(fecha: Date): string {
  return paraCampoDeFecha(new Date(Math.ceil(fecha.getTime() / 3_600_000) * 3_600_000));
}
export default async function GestionarConvocatoriaPage({ params }: Props) {
  const { id } = await params;

  const session = await auth();
  if (!session?.user) redirect('/login');

  const mesa = await miConvocatoria(session.user.id, id);
  if (!mesa) notFound();

  // Una mesa convocada ya es una partida: se gestiona alli.
  if (mesa.status === 'CONVOCADA' && mesa.gameId) {
    redirect(`/cuenta/partidas/${mesa.gameId}`);
  }

  const apuntados = mesa.preReservas.length;
  const editable = mesa.status === 'BORRADOR' || mesa.status === 'ABIERTA';
  const estado = ESTADO_DE_CONVOCATORIA[mesa.status];
  const campos = { convocatoriaId: mesa.id };

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
          {mesa.title}
        </h1>
        <Estado tono={estado.tono} className="mt-1.5">
          {estado.texto}
        </Estado>
      </div>

      <p className="text-muted-foreground mt-2 text-sm">
        {mesa.system} · Fecha flexible · {describirFranja(mesa)}
      </p>
      <p className="text-muted-foreground mt-1 text-sm">
        <Precio cents={mesa.priceCents} currency={mesa.currency} /> por plaza, que se paga
        al reservar cuando haya fecha.
      </p>

      {/* ── En qué punto está y qué se puede hacer ─────────────── */}
      {mesa.status === 'BORRADOR' && (
        <section className="border-border bg-card mt-6 rounded-sm border p-5">
          <p className="text-foreground font-medium">Todavía no la ve nadie</p>
          <p className="text-muted-foreground mt-1 text-sm">
            Repásala y publícala cuando esté lista: a partir de ahí la gente podrá
            pre-reservar su plaza.
          </p>
          <div className="mt-4">
            <ReservarBoton
              accion={publicarConvocatoriaAction}
              texto="Publicar"
              campos={campos}
            />
          </div>
        </section>
      )}

      {mesa.status === 'ABIERTA' && (
        <section className="border-border bg-card mt-6 rounded-sm border p-5">
          {alcanzaElMinimo(apuntados, mesa.minPlayers) ? (
            <>
              <p className="text-foreground font-medium">Ya tienes el mínimo</p>
              <p className="text-muted-foreground mt-1 text-sm">
                Fija la fecha cuando quieras. Hasta entonces la gente puede seguir
                apuntándose hasta llenar las {mesa.seatsTotal} plazas.
              </p>
              <div className="mt-4">
                <ConvocarForm
                  accion={convocarMesaAction}
                  convocatoriaId={mesa.id}
                  slug={mesa.slug}
                  fechaMinima={paraCampo(primeraFechaPosible(new Date()))}
                  horasParaReservar={HORAS_PARA_RESERVAR}
                />
              </div>
            </>
          ) : (
            <>
              <p className="text-foreground font-medium">Recogiendo pre-reservas</p>
              <p className="text-muted-foreground mt-1 text-sm">
                {`Faltan ${mesa.minPlayers - apuntados} para llegar al mínimo de ${mesa.minPlayers}. Comparte la mesa con tu gente para llegar antes.`}
              </p>
            </>
          )}

          <div className="mt-4 flex flex-wrap gap-3">
            {apuntados === 0 && (
              <ReservarBoton
                accion={retirarConvocatoriaAction}
                texto="Volver a borrador"
                tamano="sm"
                campos={campos}
              />
            )}
            <ReservarBoton
              accion={cerrarConvocatoriaAction}
              texto="Cerrar la mesa"
              destructivo
              tamano="sm"
              campos={campos}
            />
          </div>
        </section>
      )}

      {mesa.status === 'CERRADA' && (
        <Aviso tono="atencion" className="mt-6" titulo="Mesa cerrada">
          Se cerró sin fijar fecha. Nadie había pagado nada.
        </Aviso>
      )}

      {/* ── Quién se ha apuntado ────────────────────────────────── */}
      <Bloque
        titulo={`Pre-reservas (${apuntados} de ${mesa.seatsTotal})`}
        nota={`Mínimo para jugar: ${mesa.minPlayers}. Pre-reservar no compromete a nada: al fijar la fecha, cada uno decide si reserva y paga.`}
      >
        {apuntados === 0 ? (
          <Vacio titulo="Todavía no se ha apuntado nadie">
            {mesa.status === 'BORRADOR'
              ? 'Nadie puede pre-reservar mientras siga en borrador.'
              : 'Cuando alguien pre-reserve, aparecerá aquí.'}
          </Vacio>
        ) : (
          <ul className="border-border divide-border divide-y rounded-sm border">
            {mesa.preReservas.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <Avatar src={p.user.image} nombre={p.user.name} tamano={32} />
                <Link
                  href={`/u/${p.user.slug}`}
                  className="text-foreground text-sm font-medium hover:underline"
                >
                  {p.user.name}
                </Link>
                <span className="text-muted-foreground ml-auto text-xs">
                  <Fecha valor={p.createdAt} />
                </span>
              </li>
            ))}
          </ul>
        )}
      </Bloque>

      {editable && (
        <>
          <Bloque titulo="Lámina" nota="Es lo primero que se ve de tu mesa en el portal.">
            <figure>
              <div className="from-accent/20 to-background relative grid aspect-[16/9] place-items-center overflow-hidden rounded-sm bg-gradient-to-br sm:aspect-[3/1]">
                <Lamina
                  src={mesa.imageUrl}
                  system={mesa.system}
                  sizes="(max-width: 672px) 100vw, 42rem"
                  claseTexto="text-2xl sm:text-4xl"
                />
              </div>
              <figcaption className="text-muted-foreground mt-2 text-sm">
                {mesa.imageUrl
                  ? 'Tu lámina, tal como se verá en el portal.'
                  : 'Sin imagen propia se compone esta con el nombre del sistema.'}
              </figcaption>
            </figure>
            <div className="mt-4">
              {blobEnabled() ? (
                <ImagenForm
                  accion={subirLaminaDeConvocatoriaAction}
                  campo="lamina"
                  campos={campos}
                  textoBoton="Subir lámina"
                />
              ) : (
                <p className="text-muted-foreground text-sm">
                  La subida de imágenes no está configurada en este entorno.
                </p>
              )}
            </div>
          </Bloque>

          <Bloque titulo="Editar">
            <ConvocatoriaForm
              accion={actualizarConvocatoriaAction}
              textoBoton="Guardar cambios"
              apuntados={apuntados}
              valores={mesa}
            />
          </Bloque>
        </>
      )}
    </main>
  );
}
