'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';

import type { EstadoFormulario } from '@/modules/users/actions';

/**
 * Formulario compartido por login y registro. Cambia los campos segun el modo,
 * pero el comportamiento (estado de error, boton deshabilitado mientras envia)
 * es el mismo.
 */

type Accion = (estado: EstadoFormulario, formData: FormData) => Promise<EstadoFormulario>;

function BotonEnviar({ children }: { children: string }) {
  // useFormStatus lee el estado del formulario padre: mientras la accion de
  // servidor esta en vuelo, el boton se bloquea y evita un envio doble.
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 font-medium text-white transition hover:bg-indigo-500 focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60 dark:focus-visible:ring-offset-slate-900"
    >
      {pending ? 'Un momento...' : children}
    </button>
  );
}

const claseCampo =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:ring-indigo-900';

export function AuthForm({
  modo,
  accion,
  accionDiscord,
}: {
  modo: 'login' | 'registro';
  accion: Accion;
  /** Ausente mientras Discord no este configurado: entonces no se ofrece. */
  accionDiscord?: () => Promise<void>;
}) {
  const [estado, formAction] = useActionState<EstadoFormulario, FormData>(accion, null);

  const esRegistro = modo === 'registro';

  return (
    <div className="w-full max-w-sm">
      <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
        {esRegistro ? 'Crea tu cuenta' : 'Entra en TuGameMaster'}
      </h1>
      <p className="mt-1 mb-6 text-sm text-slate-600 dark:text-slate-400">
        {esRegistro
          ? 'Para reservar partidas o dirigir las tuyas.'
          : 'Bienvenido de vuelta.'}
      </p>

      <form action={formAction} className="space-y-4" noValidate>
        {esRegistro && (
          <div>
            <label
              htmlFor="name"
              className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              Nombre
            </label>
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              required
              className={claseCampo}
            />
          </div>
        )}

        <div>
          <label
            htmlFor="email"
            className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className={claseCampo}
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            Contraseña
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete={esRegistro ? 'new-password' : 'current-password'}
            required
            className={claseCampo}
          />
          {esRegistro && (
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Al menos 10 caracteres.
            </p>
          )}
        </div>

        {estado?.error && (
          <p
            role="alert"
            className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300"
          >
            {estado.error}
          </p>
        )}

        <BotonEnviar>{esRegistro ? 'Crear cuenta' : 'Entrar'}</BotonEnviar>
      </form>

      {accionDiscord && (
        <>
          <div className="my-5 flex items-center gap-3">
            <span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
            <span className="text-xs text-slate-500 dark:text-slate-400">o</span>
            <span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
          </div>

          <form action={accionDiscord}>
            <button
              type="submit"
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Continuar con Discord
            </button>
          </form>
        </>
      )}

      <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
        {esRegistro ? (
          <>
            ¿Ya tienes cuenta?{' '}
            <Link href="/login" className="font-medium text-indigo-600 hover:underline">
              Entra
            </Link>
          </>
        ) : (
          <>
            ¿Aún no tienes cuenta?{' '}
            <Link
              href="/registro"
              className="font-medium text-indigo-600 hover:underline"
            >
              Créala
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
