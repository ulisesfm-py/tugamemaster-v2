'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';

import type { EstadoAccion } from '@/lib/acciones';

type Accion = (estado: EstadoAccion, formData: FormData) => Promise<EstadoAccion>;

const campo =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:ring-indigo-900';

function Guardar() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-indigo-600 px-4 py-2.5 font-medium text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? 'Guardando...' : 'Guardar cambios'}
    </button>
  );
}

function Aviso({ estado }: { estado: EstadoAccion }) {
  if (!estado) return null;

  if ('error' in estado) {
    return (
      <p
        role="alert"
        className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300"
      >
        {estado.error}
      </p>
    );
  }

  return (
    <p
      role="status"
      className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
    >
      Guardado.
    </p>
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

export function PerfilJugadorForm({
  accion,
  valores,
}: {
  accion: Accion;
  valores: {
    name: string;
    bio: string | null;
    preferredSystems: string[];
    preferredStyles: string[];
  };
}) {
  const [estado, formAction] = useActionState<EstadoAccion, FormData>(accion, null);

  return (
    <form action={formAction} className="space-y-4">
      <Campo id="name" etiqueta="Nombre">
        <input
          id="name"
          name="name"
          defaultValue={valores.name}
          required
          className={campo}
        />
      </Campo>

      <Campo id="bio" etiqueta="Sobre ti" ayuda="Máximo 500 caracteres.">
        <textarea
          id="bio"
          name="bio"
          rows={4}
          defaultValue={valores.bio ?? ''}
          className={campo}
        />
      </Campo>

      <Campo
        id="preferredSystems"
        etiqueta="Sistemas que te gustan"
        ayuda="Separados por comas. Por ejemplo: D&D 5e, Vaesen, Call of Cthulhu"
      >
        <input
          id="preferredSystems"
          name="preferredSystems"
          defaultValue={valores.preferredSystems.join(', ')}
          className={campo}
        />
      </Campo>

      <Campo
        id="preferredStyles"
        etiqueta="Estilo de juego que prefieres"
        ayuda="Separados por comas. Por ejemplo: narrativo, combate, investigación"
      >
        <input
          id="preferredStyles"
          name="preferredStyles"
          defaultValue={valores.preferredStyles.join(', ')}
          className={campo}
        />
      </Campo>

      <Aviso estado={estado} />
      <Guardar />
    </form>
  );
}

export function PerfilGmForm({
  accion,
  valores,
}: {
  accion: Accion;
  valores: { headline: string; about: string | null; languages: string[] } | null;
}) {
  const [estado, formAction] = useActionState<EstadoAccion, FormData>(accion, null);

  return (
    <form action={formAction} className="space-y-4">
      <Campo
        id="headline"
        etiqueta="Titular"
        ayuda="Una línea que resuma qué tipo de mesas diriges."
      >
        <input
          id="headline"
          name="headline"
          defaultValue={valores?.headline ?? ''}
          required
          minLength={10}
          maxLength={120}
          className={campo}
          placeholder="Terror investigativo en los años 20"
        />
      </Campo>

      <Campo
        id="about"
        etiqueta="Cómo diriges"
        ayuda="Lo que un jugador querría saber antes de reservar. Máximo 2000 caracteres."
      >
        <textarea
          id="about"
          name="about"
          rows={6}
          defaultValue={valores?.about ?? ''}
          className={campo}
        />
      </Campo>

      <Campo
        id="languages"
        etiqueta="Idiomas"
        ayuda="Códigos de dos letras separados por comas: es, en, fr"
      >
        <input
          id="languages"
          name="languages"
          defaultValue={valores?.languages.join(', ') ?? 'es'}
          required
          className={campo}
        />
      </Campo>

      <Aviso estado={estado} />
      <Guardar />
    </form>
  );
}
