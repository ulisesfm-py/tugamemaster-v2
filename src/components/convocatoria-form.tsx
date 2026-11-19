'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';

import { FichaDePartida, Pastilla, type FichaInicial } from '@/components/partida-form';
import { Aviso, Button, Campo, CLASE_CONTROL } from '@/components/ui';
import { loEscrito, type EstadoAccion } from '@/lib/acciones';
import { NOMBRE_DE_LA_ZONA } from '@/lib/hora';
import { hora } from '@/modules/convocatorias/politica';

type Accion = (estado: EstadoAccion, formData: FormData) => Promise<EstadoAccion>;

const DIAS = [
  { valor: 1, texto: 'Lunes' },
  { valor: 2, texto: 'Martes' },
  { valor: 3, texto: 'Miércoles' },
  { valor: 4, texto: 'Jueves' },
  { valor: 5, texto: 'Viernes' },
  { valor: 6, texto: 'Sábado' },
  { valor: 7, texto: 'Domingo' },
] as const;

const FRECUENCIAS = [
  { valor: 'UNICA', titulo: 'Una sola sesión', texto: 'Un one-shot.' },
  { valor: 'SEMANAL', titulo: 'Cada semana', texto: 'Una campaña semanal.' },
  { valor: 'QUINCENAL', titulo: 'Cada dos semanas', texto: 'Una campaña quincenal.' },
] as const;

export type ValoresDeConvocatoria = FichaInicial & {
  id: string;
  seatsTotal: number;
  minPlayers: number;
  priceCents: number;
  weekdays: number[];
  startMinute: number;
  durationMinutes: number;
  frequency: 'UNICA' | 'SEMANAL' | 'QUINCENAL';
};

function Guardar({ texto }: { texto: string }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" tamano="lg" disabled={pending}>
      {pending ? 'Guardando…' : texto}
    </Button>
  );
}

/**
 * Formulario de una mesa con fecha flexible.
 *
 * La ficha es la de una partida (`FichaDePartida`). Lo que cambia es el
 * «cuándo»: una franja orientativa y un mínimo de jugadores en vez de una
 * fecha. La fecha la fija el GM al convocar, cuando ya hay gente.
 */
export function ConvocatoriaForm({
  accion,
  textoBoton,
  valores,
  idiomasPorDefecto = [],
  apuntados = 0,
}: {
  accion: Accion;
  textoBoton: string;
  valores?: ValoresDeConvocatoria;
  idiomasPorDefecto?: string[];
  /** Pre-reservas que ya tiene: con alguna, el precio no sube ni bajan las plazas. */
  apuntados?: number;
}) {
  const [estado, formAction] = useActionState<EstadoAccion, FormData>(accion, null);
  const escrito = loEscrito(estado);
  const { texto, marcadas } = escrito;

  const dias = marcadas('weekdays', valores ? valores.weekdays.map(String) : ['6']);
  const frecuencia = texto('frequency', valores?.frequency ?? 'UNICA');

  return (
    <form action={formAction} className="flex flex-col gap-8">
      {valores && <input type="hidden" name="convocatoriaId" value={valores.id} />}

      <FichaDePartida
        escrito={escrito}
        valores={valores}
        idiomasPorDefecto={idiomasPorDefecto}
      />

      <fieldset className="flex flex-col gap-4">
        <legend className="font-heading text-foreground mb-3 text-lg font-bold">
          Cuándo, más o menos
        </legend>
        <p className="text-muted-foreground -mt-2 text-sm">
          Es orientativo: la fecha exacta la fijas tú cuando haya gente suficiente, y
          entonces cada uno decide si reserva.
        </p>

        <div className="flex flex-col gap-2">
          <span className="text-foreground text-sm font-medium">Qué días</span>
          <div className="flex flex-wrap gap-2">
            {DIAS.map((d) => (
              <Pastilla
                key={d.valor}
                name="weekdays"
                value={String(d.valor)}
                texto={d.texto}
                defecto={dias.includes(String(d.valor))}
              />
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Campo
            id="startTime"
            etiqueta="Hora de inicio"
            ayuda={`En ${NOMBRE_DE_LA_ZONA}, aunque estés en otra zona.`}
          >
            <input
              id="startTime"
              name="startTime"
              type="time"
              step="900"
              defaultValue={texto(
                'startTime',
                valores ? hora(valores.startMinute) : '18:00',
              )}
              required
              className={CLASE_CONTROL}
            />
          </Campo>

          <Campo id="durationHours" etiqueta="Duración (horas)">
            <input
              id="durationHours"
              name="durationHours"
              type="number"
              min="1"
              max="12"
              step="0.5"
              defaultValue={texto(
                'durationHours',
                valores ? String(valores.durationMinutes / 60) : '4',
              )}
              required
              className={CLASE_CONTROL}
            />
          </Campo>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {FRECUENCIAS.map((f) => (
            <label key={f.valor} className="cursor-pointer">
              <input
                type="radio"
                name="frequency"
                value={f.valor}
                defaultChecked={frecuencia === f.valor}
                className="peer sr-only"
              />
              <span className="border-border hover:border-muted-foreground peer-checked:border-primary peer-checked:bg-primary/8 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-background block h-full rounded-sm border p-4 transition peer-focus-visible:ring-2 peer-focus-visible:ring-offset-2">
                <span className="text-foreground block font-semibold">{f.titulo}</span>
                <span className="text-muted-foreground mt-1 block text-sm">
                  {f.texto}
                </span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-4">
        <legend className="font-heading text-foreground mb-3 text-lg font-bold">
          Plazas y precio
        </legend>

        <div className="grid gap-4 sm:grid-cols-3">
          <Campo id="seatsTotal" etiqueta="Plazas">
            <input
              id="seatsTotal"
              name="seatsTotal"
              type="number"
              min="1"
              max="12"
              step="1"
              defaultValue={texto('seatsTotal', String(valores?.seatsTotal ?? 5))}
              required
              className={CLASE_CONTROL}
            />
          </Campo>

          <Campo
            id="minPlayers"
            etiqueta="Mínimo para jugar"
            ayuda="Al llegar a este número podrás fijar la fecha."
          >
            <input
              id="minPlayers"
              name="minPlayers"
              type="number"
              min="1"
              max="12"
              step="1"
              defaultValue={texto('minPlayers', String(valores?.minPlayers ?? 3))}
              required
              className={CLASE_CONTROL}
            />
          </Campo>

          <Campo id="price" etiqueta="Precio por plaza (€)">
            <input
              id="price"
              name="price"
              inputMode="decimal"
              defaultValue={texto(
                'price',
                valores ? (valores.priceCents / 100).toFixed(2) : '',
              )}
              required
              className={CLASE_CONTROL}
              placeholder="15"
            />
          </Campo>
        </div>

        <p className="text-muted-foreground text-xs">
          {apuntados > 0
            ? `Ya hay ${apuntados} ${apuntados === 1 ? 'persona apuntada' : 'personas apuntadas'}: puedes bajar el precio o añadir plazas, pero no subirlo ni quitarlas. Se apuntaron con estas condiciones.`
            : 'Pre-reservar no cuesta nada al jugador. Se paga este precio al reservar la plaza, cuando ya haya fecha.'}
        </p>
      </fieldset>

      {estado && 'error' in estado && <Aviso tono="error">{estado.error}</Aviso>}
      {estado && 'ok' in estado && <Aviso tono="exito">Guardado.</Aviso>}

      <div>
        <Guardar texto={textoBoton} />
      </div>
    </form>
  );
}
