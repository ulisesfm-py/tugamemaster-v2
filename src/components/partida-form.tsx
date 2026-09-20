'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';

import { Aviso, Button, Campo, CLASE_CONTROL } from '@/components/ui';
import type { EstadoAccion } from '@/lib/acciones';
import {
  ETIQUETAS,
  EXPERIENCIA,
  EXPERIENCIAS,
  GRUPOS,
  IDIOMAS,
  MAXIMO_ETIQUETAS,
  type Experiencia,
  type Grupo,
} from '@/modules/games/ficha';

type Accion = (estado: EstadoAccion, formData: FormData) => Promise<EstadoAccion>;

function Guardar({ texto }: { texto: string }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" tamano="lg" disabled={pending}>
      {pending ? 'Guardando…' : texto}
    </Button>
  );
}

/**
 * Casilla con aspecto de pastilla.
 *
 * Son casillas de verdad —no botones que fingen serlo— para que el formulario
 * funcione sin JavaScript y para que el teclado y los lectores de pantalla las
 * entiendan solos. Lo unico que hace el `peer` es pintar la marcada.
 */
function Pastilla({
  name,
  value,
  texto,
  defecto,
}: {
  name: string;
  value: string;
  texto: string;
  defecto: boolean;
}) {
  return (
    <label className="cursor-pointer">
      <input
        type="checkbox"
        name={name}
        value={value}
        defaultChecked={defecto}
        className="peer sr-only"
      />
      <span className="border-border text-muted-foreground hover:border-muted-foreground peer-checked:border-primary peer-checked:bg-primary/12 peer-checked:text-primary peer-focus-visible:ring-ring peer-focus-visible:ring-offset-background inline-block rounded-full border px-3 py-1.5 text-sm transition peer-focus-visible:ring-2 peer-focus-visible:ring-offset-2">
        {texto}
      </span>
    </label>
  );
}

/** Fecha en el formato que espera datetime-local, en hora local. */
function paraInput(fecha: Date): string {
  const desfase = fecha.getTimezoneOffset() * 60_000;
  return new Date(fecha.getTime() - desfase).toISOString().slice(0, 16);
}

export type ValoresDePartida = {
  id: string;
  title: string;
  description: string;
  system: string;
  startsAt: Date;
  endsAt: Date;
  seatsTotal: number;
  priceCents: number;
  languages: string[];
  experience: Experiencia;
  minAge: number | null;
  tags: string[];
};

export function PartidaForm({
  accion,
  textoBoton,
  valores,
  idiomasPorDefecto = [],
  extra,
}: {
  accion: Accion;
  textoBoton: string;
  valores?: ValoresDePartida;
  /**
   * Idiomas del game master, para una partida nueva. No se heredan al editar:
   * ahi mandan los de la mesa, que es justo el dato que se quiso separar.
   */
  idiomasPorDefecto?: string[];
  /** Campos propios de quien usa el formulario, antes del boton de guardar. */
  extra?: React.ReactNode;
}) {
  const [estado, formAction] = useActionState<EstadoAccion, FormData>(accion, null);

  const duracion = valores
    ? Math.round((valores.endsAt.getTime() - valores.startsAt.getTime()) / 3_600_000)
    : 4;

  const idiomas = valores
    ? valores.languages
    : idiomasPorDefecto.length > 0
      ? idiomasPorDefecto
      : ['es'];

  const experiencia: Experiencia = valores?.experience ?? 'ABIERTA';
  const etiquetas = valores?.tags ?? [];

  return (
    <form action={formAction} className="flex flex-col gap-8">
      {valores && <input type="hidden" name="gameId" value={valores.id} />}

      <fieldset className="flex flex-col gap-4">
        <legend className="font-heading text-foreground mb-3 text-lg font-bold">
          La partida
        </legend>

        <Campo id="title" etiqueta="Título">
          <input
            id="title"
            name="title"
            defaultValue={valores?.title ?? ''}
            required
            className={CLASE_CONTROL}
            placeholder="El faro de Finisterre"
          />
        </Campo>

        <Campo id="system" etiqueta="Sistema de juego">
          <input
            id="system"
            name="system"
            defaultValue={valores?.system ?? ''}
            required
            className={CLASE_CONTROL}
            placeholder="D&D 5e"
          />
        </Campo>

        <Campo
          id="description"
          etiqueta="Descripción"
          ayuda="Qué van a jugar, qué tono tiene la mesa y qué hace falta saber antes de apuntarse."
        >
          <textarea
            id="description"
            name="description"
            rows={7}
            defaultValue={valores?.description ?? ''}
            required
            className={CLASE_CONTROL}
          />
        </Campo>
      </fieldset>

      <fieldset className="flex flex-col gap-4">
        <legend className="font-heading text-foreground text-lg font-bold">
          Para quién es
        </legend>
        <p className="text-muted-foreground -mt-2 text-sm">
          Es lo que decide si alguien se apunta. Nadie reserva una mesa si no sabe si va a
          encajar en ella.
        </p>

        <Campo
          id="experience"
          etiqueta="Experiencia que se presupone"
          ayuda={EXPERIENCIA[experiencia].explicacion}
        >
          <select
            id="experience"
            name="experience"
            defaultValue={experiencia}
            className={CLASE_CONTROL}
          >
            {EXPERIENCIAS.map((nivel) => (
              <option key={nivel} value={nivel}>
                {EXPERIENCIA[nivel].titulo}
              </option>
            ))}
          </select>
        </Campo>

        <div className="flex flex-col gap-2">
          <span className="text-foreground text-sm font-medium">Idioma de la mesa</span>
          <div className="flex flex-wrap gap-2">
            {IDIOMAS.map((i) => (
              <Pastilla
                key={i.codigo}
                name="languages"
                value={i.codigo}
                texto={i.texto}
                defecto={idiomas.includes(i.codigo)}
              />
            ))}
          </div>
          <p className="text-muted-foreground text-xs">
            El de esta partida, no el de todas las tuyas.
          </p>
        </div>

        <Campo
          id="minAge"
          etiqueta="Edad mínima"
          opcional
          ayuda="Déjalo vacío si no hay ninguna."
        >
          <input
            id="minAge"
            name="minAge"
            type="number"
            min="6"
            max="99"
            step="1"
            defaultValue={valores?.minAge ?? ''}
            className={`${CLASE_CONTROL} w-32`}
            placeholder="16"
          />
        </Campo>

        {(Object.keys(GRUPOS) as Grupo[]).map((grupo) => (
          <div key={grupo} className="flex flex-col gap-2">
            <span className="text-foreground text-sm font-medium">{GRUPOS[grupo]}</span>
            <div className="flex flex-wrap gap-2">
              {ETIQUETAS.filter((e) => e.grupo === grupo).map((e) => (
                <Pastilla
                  key={e.id}
                  name="tags"
                  value={e.id}
                  texto={e.texto}
                  defecto={etiquetas.includes(e.id)}
                />
              ))}
            </div>
          </div>
        ))}

        <p className="text-muted-foreground text-xs">
          Hasta {MAXIMO_ETIQUETAS} etiquetas entre las dos listas. Una mesa etiquetada con
          todo no dice nada.
        </p>
      </fieldset>

      <fieldset className="flex flex-col gap-4">
        <legend className="font-heading text-foreground mb-3 text-lg font-bold">
          Cuándo y cuánto
        </legend>

        <div className="grid gap-4 sm:grid-cols-2">
          <Campo id="startsAt" etiqueta="Empieza">
            <input
              id="startsAt"
              name="startsAt"
              type="datetime-local"
              defaultValue={valores ? paraInput(valores.startsAt) : ''}
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
              step="1"
              defaultValue={duracion}
              required
              className={CLASE_CONTROL}
            />
          </Campo>

          <Campo id="seatsTotal" etiqueta="Plazas">
            <input
              id="seatsTotal"
              name="seatsTotal"
              type="number"
              min="1"
              max="12"
              step="1"
              defaultValue={valores?.seatsTotal ?? 4}
              required
              className={CLASE_CONTROL}
            />
          </Campo>

          <Campo id="price" etiqueta="Precio por plaza (€)">
            <input
              id="price"
              name="price"
              inputMode="decimal"
              defaultValue={valores ? (valores.priceCents / 100).toFixed(2) : ''}
              required
              className={CLASE_CONTROL}
              placeholder="15"
            />
          </Campo>
        </div>
      </fieldset>

      {extra}

      {estado && 'error' in estado && <Aviso tono="error">{estado.error}</Aviso>}
      {estado && 'ok' in estado && <Aviso tono="exito">Guardado.</Aviso>}

      <div>
        <Guardar texto={textoBoton} />
      </div>
    </form>
  );
}
