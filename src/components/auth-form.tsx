'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';

import { Aviso, Button, Campo, CLASE_CONTROL } from '@/components/ui';
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
    <Button type="submit" tamano="lg" disabled={pending} className="w-full">
      {pending ? 'Un momento…' : children}
    </Button>
  );
}

export function AuthForm({
  modo,
  accion,
  accionDiscord,
  minimoPassword,
}: {
  modo: 'login' | 'registro';
  accion: Accion;
  /** Ausente mientras Discord no este configurado: entonces no se ofrece. */
  accionDiscord?: () => Promise<void>;
  /**
   * Longitud minima, para decirla antes de que la rechace el servidor.
   *
   * Llega como propiedad desde la pagina porque la constante vive junto al
   * hash de argon2, un binario nativo que no puede entrar en el navegador.
   */
  minimoPassword: number;
}) {
  const [estado, formAction] = useActionState<EstadoFormulario, FormData>(accion, null);

  const esRegistro = modo === 'registro';

  return (
    <div className="border-border bg-card rounded-sm border p-6 sm:p-8">
      <h1 className="font-heading text-foreground text-2xl font-extrabold">
        {esRegistro ? 'Crea tu cuenta' : 'Entra en TuGameMaster'}
      </h1>
      <p className="text-muted-foreground mt-1 mb-6 text-sm">
        {esRegistro
          ? 'Para reservar partidas o dirigir las tuyas.'
          : 'Bienvenido de vuelta.'}
      </p>

      <form action={formAction} className="flex flex-col gap-4" noValidate>
        {esRegistro && (
          <Campo id="name" etiqueta="Nombre">
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              required
              className={CLASE_CONTROL}
            />
          </Campo>
        )}

        <Campo id="email" etiqueta="Email">
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className={CLASE_CONTROL}
          />
        </Campo>

        <Campo
          id="password"
          etiqueta="Contraseña"
          ayuda={esRegistro ? `Al menos ${minimoPassword} caracteres.` : undefined}
        >
          <input
            id="password"
            name="password"
            type="password"
            autoComplete={esRegistro ? 'new-password' : 'current-password'}
            required
            className={CLASE_CONTROL}
          />
        </Campo>

        {estado?.error && <Aviso tono="error">{estado.error}</Aviso>}

        <BotonEnviar>{esRegistro ? 'Crear cuenta' : 'Entrar'}</BotonEnviar>
      </form>

      {accionDiscord && (
        <>
          <div className="my-5 flex items-center gap-3">
            <span className="bg-border h-px flex-1" />
            <span className="text-muted-foreground text-xs">o</span>
            <span className="bg-border h-px flex-1" />
          </div>

          <form action={accionDiscord}>
            <Button type="submit" variante="perfil" tamano="lg" className="w-full">
              Continuar con Discord
            </Button>
          </form>
        </>
      )}

      <p className="text-muted-foreground mt-6 text-center text-sm">
        {esRegistro ? (
          <>
            ¿Ya tienes cuenta?{' '}
            <Link href="/login" className="text-primary font-medium hover:underline">
              Entra
            </Link>
          </>
        ) : (
          <>
            ¿Aún no tienes cuenta?{' '}
            <Link href="/registro" className="text-primary font-medium hover:underline">
              Créala
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
