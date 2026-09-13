'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';

import type { EstadoAccion } from '@/lib/acciones';

type Accion = (estado: EstadoAccion, formData: FormData) => Promise<EstadoAccion>;

const campo =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:ring-indigo-900';

function Guardar({ texto }: { texto: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-indigo-600 px-5 py-2.5 font-medium text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? 'Guardando...' : texto}
    </button>
  );
}

function Campo({
  id,
  etiqueta,
  ayuda,
  children,
}: {
  id: string;
  etiqueta: string;
  ayuda?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300"
      >
        {etiqueta}
      </label>
      {children}
      {ayuda && (
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{ayuda}</p>
      )}
    </div>
  );
}

/** Fecha en el formato que espera datetime-local, en hora local. */
function paraInput(fecha: Date): string {
  const desfase = fecha.getTimezoneOffset() * 60_000;
  return new Date(fecha.getTime() - desfase).toISOString().slice(0, 16);
}

export function PartidaForm({
  accion,
  textoBoton,
  valores,
}: {
  accion: Accion;
  textoBoton: string;
  valores?: {
    id: string;
    title: string;
    description: string;
    system: string;
    startsAt: Date;
    endsAt: Date;
    seatsTotal: number;
    priceCents: number;
  };
}) {
  const [estado, formAction] = useActionState<EstadoAccion, FormData>(accion, null);

  const duracion = valores
    ? Math.round((valores.endsAt.getTime() - valores.startsAt.getTime()) / 3_600_000)
    : 4;

  return (
    <form action={formAction} className="space-y-4">
      {valores && <input type="hidden" name="gameId" value={valores.id} />}

      <Campo id="title" etiqueta="Título">
        <input
          id="title"
          name="title"
          defaultValue={valores?.title ?? ''}
          required
          className={campo}
          placeholder="El faro de Finisterre"
        />
      </Campo>

      <Campo id="system" etiqueta="Sistema de juego">
        <input
          id="system"
          name="system"
          defaultValue={valores?.system ?? ''}
          required
          className={campo}
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
          className={campo}
        />
      </Campo>

      <div className="grid gap-4 sm:grid-cols-2">
        <Campo id="startsAt" etiqueta="Empieza">
          <input
            id="startsAt"
            name="startsAt"
            type="datetime-local"
            defaultValue={valores ? paraInput(valores.startsAt) : ''}
            required
            className={campo}
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
            className={campo}
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
            className={campo}
          />
        </Campo>

        <Campo id="price" etiqueta="Precio por plaza (€)">
          <input
            id="price"
            name="price"
            inputMode="decimal"
            defaultValue={valores ? (valores.priceCents / 100).toFixed(2) : ''}
            required
            className={campo}
            placeholder="15"
          />
        </Campo>
      </div>

      {estado && 'error' in estado && (
        <p
          role="alert"
          className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300"
        >
          {estado.error}
        </p>
      )}

      {estado && 'ok' in estado && (
        <p
          role="status"
          className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
        >
          Guardado.
        </p>
      )}

      <Guardar texto={textoBoton} />
    </form>
  );
}
