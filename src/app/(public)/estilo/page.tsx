import type { Metadata } from 'next';

import { PartidaCard } from '@/components/partida-card';
import {
  Avatar,
  Aviso,
  Button,
  Campo,
  CLASE_CONTROL,
  Estado,
  ESTADO_DE_INCIDENCIA,
  ESTADO_DE_PAGO,
  ESTADO_DE_PARTIDA,
  ESTADO_DE_RESERVA,
  Estrellas,
  Etiqueta,
  type TonoDeEstado,
  Vacio,
} from '@/components/ui';

/**
 * Muestrario de la interfaz.
 *
 * No sale en el menu ni se enlaza desde ninguna parte: existe para ver todas
 * las piezas juntas y detectar que dos cosas que deberian parecerse no se
 * parecen. Es mucho mas rapido que ir abriendo pantallas sueltas.
 */
export const metadata: Metadata = {
  title: 'Estilo · TuGameMaster',
  robots: { index: false, follow: false },
};

const AHORA = new Date('2026-10-18T18:00:00Z');

/** Partidas de mentira, con sus casos limite: llena, con una plaza, holgada. */
const EJEMPLOS = [
  {
    title: 'La sombra sobre Cádiz · Sesión 2',
    slug: '#',
    system: 'Call of Cthulhu 7e',
    startsAt: AHORA,
    seatsTotal: 4,
    priceCents: 1500,
    currency: 'EUR',
    gm: { user: { name: 'Laura Vega', slug: '#', image: null } },
    _count: { bookings: 3 },
    reputacion: { valoracionMedia: 4.5, totalResenas: 12 },
  },
  {
    title: 'El faro de Finisterre',
    slug: '#',
    system: 'Vaesen',
    startsAt: new Date(AHORA.getTime() + 6 * 86_400_000),
    seatsTotal: 5,
    priceCents: 2000,
    currency: 'EUR',
    gm: { user: { name: 'Marco Ruiz', slug: '#', image: null } },
    _count: { bookings: 1 },
    reputacion: { valoracionMedia: 4.8, totalResenas: 31 },
  },
  {
    title: 'Los subterráneos de Triana',
    slug: '#',
    system: 'D&D 5e',
    startsAt: new Date(AHORA.getTime() + 13 * 86_400_000),
    seatsTotal: 6,
    priceCents: 0,
    currency: 'EUR',
    gm: { user: { name: 'Ana Soto', slug: '#', image: null } },
    _count: { bookings: 6 },
    reputacion: { valoracionMedia: null, totalResenas: 0 },
  },
];

/** Todos los estados del dominio, para verlos de una pasada. */
const GRUPOS_DE_ESTADO: {
  nombre: string;
  mapa: Record<string, { texto: string; tono: TonoDeEstado }>;
}[] = [
  { nombre: 'Partida', mapa: ESTADO_DE_PARTIDA },
  { nombre: 'Reserva', mapa: ESTADO_DE_RESERVA },
  { nombre: 'Incidencia', mapa: ESTADO_DE_INCIDENCIA },
  { nombre: 'Pago al GM', mapa: ESTADO_DE_PAGO },
];

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
    <section className="border-border flex flex-col gap-4 border-t pt-8">
      <div>
        <h2 className="font-heading text-foreground text-xl font-bold">{titulo}</h2>
        {nota && <p className="text-muted-foreground mt-1 max-w-prose text-sm">{nota}</p>}
      </div>
      {children}
    </section>
  );
}

export default function EstiloPage() {
  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-10 px-4 py-12">
      <header>
        <p className="text-muted-foreground text-xs font-semibold tracking-widest uppercase">
          Interno
        </p>
        <h1 className="font-heading text-foreground mt-2 text-4xl font-extrabold tracking-tight">
          Piezas
        </h1>
        <p className="text-muted-foreground mt-2 max-w-prose">
          Todo lo que compone la interfaz, junto y en Brasa. No está enlazada desde ningún
          sitio: sirve para comprobar que dos cosas que deberían parecerse se parecen.
        </p>
      </header>

      <Bloque
        titulo="Color"
        nota="Un solo acento, el ascua, y se gasta en lo que hay que pulsar. El latón acompaña; los estados no comparten tono con ninguno de los dos."
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            ['Fondo', 'bg-background'],
            ['Superficie', 'bg-card'],
            ['Intermedia', 'bg-secondary'],
            ['Filo', 'bg-border'],
            ['Ascua', 'bg-primary'],
            ['Latón', 'bg-accent'],
            ['Bien', 'bg-success'],
            ['Peligro', 'bg-destructive'],
          ].map(([nombre, clase]) => (
            <div key={nombre} className="border-border overflow-hidden rounded-sm border">
              <div className={`h-14 ${clase}`} />
              <p className="bg-card text-muted-foreground px-2 py-1.5 text-xs">
                {nombre}
              </p>
            </div>
          ))}
        </div>
      </Bloque>

      <Bloque
        titulo="Tipografía"
        nota="Bricolage Grotesque para títulos, Barlow para el resto. Dos familias y solo dos."
      >
        <div className="border-border bg-card flex flex-col gap-3 rounded-sm border p-5">
          <p className="font-heading text-foreground text-3xl font-extrabold">
            La sombra sobre Cádiz
          </p>
          <p className="font-heading text-foreground text-xl font-bold">
            Sesión 2 de la campaña
          </p>
          <p className="text-foreground max-w-prose">
            Cuerpo de texto en Barlow. Una investigación en tres sesiones por los muelles
            de un Cádiz que esconde algo bajo el agua.
          </p>
          <p className="text-muted-foreground text-sm">
            Texto secundario: fechas, sistemas, pies de tarjeta.
          </p>
        </div>
      </Bloque>

      <Bloque
        titulo="Botones"
        nota="Solo el sólido lleva relieve, y por eso se reserva a la acción principal de cada pantalla. Si hubiera tres, ninguno destacaría."
      >
        <div className="border-border bg-card flex flex-wrap items-center gap-3 rounded-sm border p-5">
          <Button>Reservar plaza</Button>
          <Button variante="perfil">Ver la mesa</Button>
          <Button variante="fantasma">Cancelar</Button>
          <Button variante="peligro">Cancelar partida</Button>
          <Button variante="enlace">Ver condiciones</Button>
          <Button disabled>Sin plazas</Button>
        </div>
        <div className="border-border bg-card flex flex-wrap items-center gap-3 rounded-sm border p-5">
          <Button tamano="sm">Pequeño</Button>
          <Button tamano="md">Normal</Button>
          <Button tamano="lg">Grande</Button>
        </div>
      </Bloque>

      <Bloque
        titulo="Estados"
        nota="El mismo significado, siempre el mismo color. Si «cancelada» es roja en un sitio y gris en otro, el color decora en vez de informar."
      >
        <div className="border-border bg-card flex flex-col gap-4 rounded-sm border p-5">
          {GRUPOS_DE_ESTADO.map((grupo) => (
            <div key={grupo.nombre} className="flex flex-wrap items-center gap-2">
              <span className="text-muted-foreground w-24 shrink-0 text-xs font-semibold tracking-wider uppercase">
                {grupo.nombre}
              </span>
              {Object.entries(grupo.mapa).map(([clave, v]) => (
                <Estado key={clave} tono={v.tono}>
                  {v.texto}
                </Estado>
              ))}
            </div>
          ))}
        </div>
      </Bloque>

      <Bloque
        titulo="Avisos"
        nota="Un acierto se anuncia con status y un fallo con alert, que es lo que hace que un lector de pantalla los lea sin ir a buscarlos."
      >
        <div className="flex flex-col gap-3">
          <Aviso tono="exito" titulo="Plaza confirmada">
            Se han usado 5,00 € de tu saldo y has pagado 10,00 € con tarjeta.
          </Aviso>
          <Aviso tono="error" titulo="No hemos podido cobrarte">
            Tu banco ha rechazado la tarjeta. Prueba con otra desde Mis reservas.
          </Aviso>
          <Aviso tono="atencion" titulo="Tu pago está retenido">
            Hay una incidencia abierta en esta partida. Se resolverá antes de que te
            transfiramos.
          </Aviso>
          <Aviso tono="dato">
            Cancelación gratuita hasta 48 horas antes: se te devuelve el 90% en saldo.
          </Aviso>
        </div>
      </Bloque>

      <Bloque
        titulo="Formulario"
        nota="Etiqueta, control, ayuda y error, siempre en el mismo orden."
      >
        <div className="border-border bg-card grid gap-4 rounded-sm border p-5 sm:grid-cols-2">
          <Campo id="demo-titulo" etiqueta="Título" ayuda="Lo que se lee en la tarjeta.">
            <input
              id="demo-titulo"
              className={CLASE_CONTROL}
              defaultValue="La sombra sobre Cádiz"
            />
          </Campo>

          <Campo id="demo-sistema" etiqueta="Sistema de juego">
            <select id="demo-sistema" className={CLASE_CONTROL} defaultValue="coc">
              <option value="coc">Call of Cthulhu 7e</option>
              <option value="dnd">D&amp;D 5e</option>
              <option value="vaesen">Vaesen</option>
            </select>
          </Campo>

          <Campo
            id="demo-precio"
            etiqueta="Precio por plaza"
            error="Ese precio no cubre ni el coste de procesarlo."
          >
            <input id="demo-precio" className={CLASE_CONTROL} defaultValue="0,30" />
          </Campo>

          <Campo id="demo-resumen" etiqueta="Resumen" opcional className="sm:col-span-2">
            <textarea id="demo-resumen" rows={3} className={CLASE_CONTROL} />
          </Campo>
        </div>
      </Bloque>

      <Bloque
        titulo="Tarjeta de partida"
        nota="La pieza que más se repite. Las plazas se cuentan como urgencia, la nota del GM va a la vista, y siempre hay lámina: sin imagen propia, la compone el sistema de juego."
      >
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {EJEMPLOS.map((p) => (
            <PartidaCard key={p.title} partida={p} />
          ))}
        </ul>
      </Bloque>

      <Bloque
        titulo="Sin contenido"
        nota="Un hueco vacío casi siempre tiene algo que la persona puede hacer. Por eso admite una acción y no se queda en «no hay nada»."
      >
        <Vacio
          titulo="No tienes ninguna partida próxima"
          accion={<Button>Buscar mesa</Button>}
        >
          Cuando reserves una plaza, aparecerá aquí con su fecha y su cuenta atrás.
        </Vacio>
      </Bloque>

      <Bloque titulo="Piezas sueltas">
        <div className="border-border bg-card flex flex-wrap items-center gap-6 rounded-sm border p-5">
          <div className="flex items-center gap-2">
            <Avatar src={null} nombre="Laura Vega" tamano={40} />
            <span className="text-muted-foreground text-sm">Avatar sin foto</span>
          </div>
          <Estrellas valor={4.5} total={12} />
          <Estrellas valor={null} total={0} />
          <span className="flex gap-2">
            <Etiqueta>ES</Etiqueta>
            <Etiqueta>EN</Etiqueta>
          </span>
        </div>
      </Bloque>
    </main>
  );
}
