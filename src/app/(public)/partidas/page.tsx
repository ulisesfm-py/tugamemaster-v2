import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';

import { PartidaCard } from '@/components/partida-card';
import { Button, Cargando, CLASE_CONTROL, EnlaceBoton, Vacio } from '@/components/ui';
import { cn } from '@/lib/utils';
import { ETIQUETAS } from '@/modules/games/ficha';
import { listarPartidas, sistemasDisponibles } from '@/modules/games/queries';
import { filtrosSchema, type Filtros } from '@/modules/games/schema';

export const metadata: Metadata = {
  title: 'Partidas · TuGameMaster',
  description: 'Partidas de rol con plazas libres, dirigidas por game masters.',
};

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/**
 * Atajos curados, por encima de los filtros.
 *
 * Quitan el problema de la pagina en blanco: quien llega sin saber que buscar
 * no tiene que rellenar un formulario para empezar a ver cosas. Son enlaces y
 * no botones a proposito —cada uno es una URL que se puede compartir, guardar
 * y enlazar desde fuera.
 */
const ATAJOS: { texto: string; parametros: Record<string, string> }[] = [
  { texto: 'Esta semana', parametros: { cuando: 'semana' } },
  { texto: 'Últimas plazas', parametros: { ultimasPlazas: '1' } },
  { texto: 'Para empezar', parametros: { experiencia: 'ABIERTA' } },
  { texto: 'Sin coste', parametros: { maxPrecio: '0' } },
  { texto: 'Terror', parametros: { etiqueta: 'terror' } },
  { texto: 'Fantasía', parametros: { etiqueta: 'fantasia' } },
];

/** True si el atajo es justo lo que esta puesto ahora mismo. */
function atajoActivo(
  parametros: Record<string, string>,
  actuales: URLSearchParams,
): boolean {
  return Object.entries(parametros).every(
    ([clave, valor]) => actuales.get(clave) === valor,
  );
}

function Chip({
  href,
  activo,
  children,
}: {
  href: string;
  activo: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={activo ? 'true' : undefined}
      className={cn(
        'focus-visible:ring-ring focus-visible:ring-offset-background rounded-full border px-3.5 py-1.5 text-sm font-medium whitespace-nowrap transition focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
        activo
          ? 'border-primary bg-primary/15 text-primary'
          : 'border-border text-muted-foreground hover:border-muted-foreground hover:text-foreground',
      )}
    >
      {children}
    </Link>
  );
}

/**
 * Lo que se le dice a alguien cuyo filtro no ha encontrado nada.
 *
 * Nombrar el filtro que no ha dado resultados ahorra la duda de si es que no
 * hay mesas o es que el buscador no funciona.
 */
function textoVacio(filtros: Filtros): string {
  if (filtros.q) return `Nada encaja con «${filtros.q}»`;
  if (filtros.ultimasPlazas) return 'Ninguna mesa está a punto de llenarse';
  if (filtros.cuando === 'semana') return 'No hay mesas esta semana';

  const etiqueta = ETIQUETAS.find((e) => e.id === filtros.etiqueta);
  if (etiqueta)
    return `Ahora mismo no hay ninguna mesa de ${etiqueta.texto.toLowerCase()}`;

  if (filtros.experiencia === 'ABIERTA') {
    return 'Ninguna mesa abierta a principiantes ahora mismo';
  }

  return 'No hay partidas que encajen con lo que buscas';
}

/**
 * Las mesas, que es lo unico de esta pagina que espera a la base de datos.
 *
 * Va en su propio componente para poder envolverlo en `<Suspense>`: asi el
 * titulo, los atajos y los filtros se pintan enseguida y solo la lista llega
 * despues, con su esqueleto mientras tanto.
 *
 * **No se usa un `loading.tsx` de ruta**, que seria lo obvio: un fichero de
 * carga en este segmento convierte la respuesta en streaming, y entonces el
 * 200 se envia antes de que `/partidas/[slug]` pueda llamar a `notFound()`.
 * Una partida inexistente pasaba a contestar 200 en vez de 404. Con Suspense
 * dentro de la pagina, el efecto se queda en esta pagina, que nunca da 404.
 */
async function Mesas({ filtros }: { filtros: Filtros }) {
  const partidas = await listarPartidas(filtros);
  const etiquetaPuesta = ETIQUETAS.find((e) => e.id === filtros.etiqueta);
  const hayFiltro = Object.keys(filtros).length > 0;

  return (
    <>
      <p className="text-muted-foreground mt-6 text-sm" aria-live="polite">
        {partidas.length === 1 ? '1 mesa' : `${partidas.length} mesas`}
        {etiquetaPuesta && ` de ${etiquetaPuesta.texto.toLowerCase()}`}
        {filtros.cuando === 'semana' && ' esta semana'}
      </p>

      {partidas.length === 0 ? (
        <Vacio
          className="mt-4"
          titulo={textoVacio(filtros)}
          accion={
            hayFiltro ? (
              <EnlaceBoton href="/partidas" variante="perfil">
                Ver todas
              </EnlaceBoton>
            ) : undefined
          }
        >
          Prueba a quitar algún filtro, o mira qué game masters dirigen aquí para no
          perderte su próxima mesa.
        </Vacio>
      ) : (
        <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {partidas.map((p) => (
            <PartidaCard key={p.id} partida={p} />
          ))}
        </ul>
      )}
    </>
  );
}

export default async function PartidasPage({ searchParams }: Props) {
  const params = await searchParams;

  // Los filtros vienen de la URL, que cualquiera puede manipular: se validan
  // igual que cualquier otra entrada. Si algo no cuadra, se ignora en vez de
  // romper la pagina.
  const texto = (clave: string) =>
    typeof params[clave] === 'string' && params[clave] !== ''
      ? (params[clave] as string)
      : undefined;

  const parsed = filtrosSchema.safeParse({
    q: texto('q'),
    system: texto('system'),
    maxPrecio: texto('maxPrecio'),
    experiencia: texto('experiencia'),
    etiqueta: texto('etiqueta'),
    cuando: texto('cuando'),
    soloLibres: params['soloLibres'] === '1',
    ultimasPlazas: params['ultimasPlazas'] === '1',
  });

  const filtros = parsed.success ? parsed.data : {};

  const sistemas = await sistemasDisponibles();

  // Para saber que atajo esta puesto, se mira la URL tal cual y no los filtros
  // ya validados: «sin coste» es maxPrecio=0, y un 0 validado no se distingue
  // de un campo vacio.
  const actuales = new URLSearchParams(
    Object.entries(params).flatMap(([clave, valor]) =>
      typeof valor === 'string' ? [[clave, valor] as [string, string]] : [],
    ),
  );

  const hayFiltro = [...actuales.keys()].length > 0;

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="font-heading text-foreground text-3xl font-extrabold sm:text-4xl">
        Mesas abiertas
      </h1>
      <p className="text-muted-foreground mt-2">
        Reserva una tarde suelta. Pagas tu plaza y no te suscribes a nada.
      </p>

      <nav aria-label="Atajos" className="-mx-4 mt-6 overflow-x-auto px-4">
        <div className="flex gap-2 pb-1">
          <Chip href="/partidas" activo={!hayFiltro}>
            Todas
          </Chip>

          {ATAJOS.map((a) => (
            <Chip
              key={a.texto}
              href={`/partidas?${new URLSearchParams(a.parametros)}`}
              activo={atajoActivo(a.parametros, actuales)}
            >
              {a.texto}
            </Chip>
          ))}
        </div>
      </nav>

      <form
        method="get"
        className="border-border bg-card mt-5 flex flex-wrap items-end gap-3 rounded-sm border p-4"
      >
        {/* Los atajos viajan escondidos en el formulario: sin esto, buscar
            algo dentro de «esta semana» te sacaria de «esta semana». */}
        {(['cuando', 'etiqueta', 'experiencia', 'ultimasPlazas'] as const).map((clave) =>
          actuales.get(clave) ? (
            <input
              key={clave}
              type="hidden"
              name={clave}
              value={actuales.get(clave) ?? ''}
            />
          ) : null,
        )}

        <div className="min-w-48 flex-1">
          <label
            htmlFor="q"
            className="text-muted-foreground mb-1.5 block text-xs font-semibold tracking-widest uppercase"
          >
            Buscar
          </label>
          <input
            id="q"
            name="q"
            defaultValue={filtros.q ?? ''}
            placeholder="Título o descripción"
            className={CLASE_CONTROL}
          />
        </div>

        <div>
          <label
            htmlFor="system"
            className="text-muted-foreground mb-1.5 block text-xs font-semibold tracking-widest uppercase"
          >
            Sistema
          </label>
          <select
            id="system"
            name="system"
            defaultValue={filtros.system ?? ''}
            className={CLASE_CONTROL}
          >
            <option value="">Todos</option>
            {sistemas.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="maxPrecio"
            className="text-muted-foreground mb-1.5 block text-xs font-semibold tracking-widest uppercase"
          >
            Hasta (€)
          </label>
          <input
            id="maxPrecio"
            name="maxPrecio"
            type="number"
            min="0"
            step="1"
            defaultValue={filtros.maxPrecio ?? ''}
            className={`${CLASE_CONTROL} w-28`}
          />
        </div>

        <label className="text-foreground flex items-center gap-2 py-2.5 text-sm">
          <input
            type="checkbox"
            name="soloLibres"
            value="1"
            defaultChecked={filtros.soloLibres ?? false}
            className="accent-primary size-4"
          />
          Con plazas
        </label>

        <Button type="submit" variante="perfil">
          Filtrar
        </Button>
      </form>

      {/* La `key` cambia con los filtros para que al filtrar vuelva a
          suspenderse: sin ella, React conserva la lista anterior y parece que
          el filtro no ha hecho nada. */}
      <Suspense
        key={JSON.stringify(filtros)}
        fallback={<Cargando className="mt-10" titular={false} />}
      >
        <Mesas filtros={filtros} />
      </Suspense>
    </main>
  );
}
