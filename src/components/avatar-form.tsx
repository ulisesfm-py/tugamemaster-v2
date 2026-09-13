'use client';

import { useActionState, useRef, useState } from 'react';
import { useFormStatus } from 'react-dom';

import type { EstadoAccion } from '@/lib/acciones';

type Accion = (estado: EstadoAccion, formData: FormData) => Promise<EstadoAccion>;

const TAMANO_MAXIMO_BYTES = 2 * 1024 * 1024;
const TIPOS = 'image/jpeg,image/png,image/webp';

function BotonSubir({ hayArchivo }: { hayArchivo: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending || !hayArchivo}
      className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? 'Subiendo...' : 'Subir foto'}
    </button>
  );
}

function BotonQuitar() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="text-sm text-slate-500 underline-offset-2 hover:underline disabled:opacity-50 dark:text-slate-400"
    >
      {pending ? 'Quitando...' : 'Quitar foto'}
    </button>
  );
}

export function AvatarForm({
  accionSubir,
  accionQuitar,
  tieneFoto,
}: {
  accionSubir: Accion;
  accionQuitar: Accion;
  tieneFoto: boolean;
}) {
  const [estadoSubida, subirAction] = useActionState<EstadoAccion, FormData>(
    accionSubir,
    null,
  );
  const [estadoBorrado, quitarAction] = useActionState<EstadoAccion, FormData>(
    accionQuitar,
    null,
  );

  const [errorLocal, setErrorLocal] = useState<string | null>(null);
  const [nombreArchivo, setNombreArchivo] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Comprobacion en el navegador: evita subir 10 MB para que el servidor los
  // rechace. El servidor valida igualmente, que es donde cuenta.
  function alElegir(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setErrorLocal(null);
    setNombreArchivo(null);

    if (!file) return;

    if (file.size > TAMANO_MAXIMO_BYTES) {
      setErrorLocal('La imagen no puede pasar de 2 MB');
      if (inputRef.current) inputRef.current.value = '';
      return;
    }

    setNombreArchivo(file.name);
  }

  const estado = estadoSubida ?? estadoBorrado;

  return (
    <div className="space-y-3">
      <form action={subirAction} className="flex flex-wrap items-center gap-3">
        <input
          ref={inputRef}
          type="file"
          name="avatar"
          accept={TIPOS}
          onChange={alElegir}
          aria-label="Elegir foto de perfil"
          className="max-w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border file:border-slate-300 file:bg-white file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-50 dark:text-slate-400 dark:file:border-slate-700 dark:file:bg-slate-800 dark:file:text-slate-200"
        />
        <BotonSubir hayArchivo={nombreArchivo !== null} />
      </form>

      <p className="text-xs text-slate-500 dark:text-slate-400">
        JPG, PNG o WebP. Máximo 2 MB.
      </p>

      {errorLocal && (
        <p
          role="alert"
          className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300"
        >
          {errorLocal}
        </p>
      )}

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
          {estado.mensaje ?? 'Hecho.'}
        </p>
      )}

      {tieneFoto && (
        <form action={quitarAction}>
          <BotonQuitar />
        </form>
      )}
    </div>
  );
}
