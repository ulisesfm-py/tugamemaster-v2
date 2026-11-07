'use client';

import Link from 'next/link';
import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';

import { Aviso, Button, Campo, CLASE_CONTROL } from '@/components/ui';
import { loEscrito } from '@/lib/acciones';
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
  codigoInicial = '',
  invitacion,
}: {
  modo: 'login' | 'registro';
  accion: Accion;
  /** Ausente mientras Discord no este configurado: entonces no se ofrece. */
  accionDiscord?: Accion;
  /** El codigo de fundador que trae el enlace, para dejarlo ya escrito. */
  codigoInicial?: string;
  /**
   * Lo que se sabe del codigo del enlace: de quien es, o por que no vale.
   * Se comprueba en la pagina, antes de que la persona escriba nada.
   */
  invitacion?: { ok: true; nombre: string } | { ok: false; mensaje: string };
  /**
   * Longitud minima, para decirla antes de que la rechace el servidor.
   *
   * Llega como propiedad desde la pagina porque la constante vive junto al
   * hash de argon2, un binario nativo que no puede entrar en el navegador.
   */
  minimoPassword: number;
}) {
  const [estado, formAction] = useActionState<EstadoFormulario, FormData>(accion, null);
  const [estadoDiscord, formActionDiscord] = useActionState<EstadoFormulario, FormData>(
    accionDiscord ?? (async () => null),
    null,
  );

  const esRegistro = modo === 'registro';

  // Lo que se acababa de escribir. React vacia el formulario en cuanto termina
  // la accion, y equivocarse de contrasena no deberia costar tambien el email.
  // La accion devuelve el email y el nombre, nunca la contrasena.
  const { texto } = loEscrito(estado);

  // El codigo se lleva en estado y no solo en el campo: el boton de Discord
  // vive en otro formulario y tiene que enviar lo mismo que hay escrito aqui.
  const [codigo, setCodigo] = useState(texto('codigo', codigoInicial));

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

      {esRegistro && invitacion?.ok && (
        <Aviso tono="exito" className="mb-5">
          Te invita <strong>{invitacion.nombre}</strong>. Al crear tu cuenta quedarás como
          jugador suyo en TuGameMaster.
        </Aviso>
      )}

      {esRegistro && invitacion && !invitacion.ok && (
        <Aviso tono="atencion" className="mb-5">
          {invitacion.mensaje}
        </Aviso>
      )}

      <form action={formAction} className="flex flex-col gap-4" noValidate>
        {esRegistro && (
          <Campo id="name" etiqueta="Nombre">
            <input
              id="name"
              name="name"
              type="text"
              defaultValue={texto('name')}
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
            defaultValue={texto('email')}
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

        {esRegistro && (
          <Campo
            id="codigo"
            etiqueta="Código de tu game master (opcional)"
            ayuda="Si un game master te ha dado uno. Solo sirve al crear la cuenta."
          >
            <input
              id="codigo"
              name="codigo"
              type="text"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              placeholder="K7M2-QX9A"
              className={`${CLASE_CONTROL} font-mono tracking-wider uppercase`}
            />
          </Campo>
        )}

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

          <form action={formActionDiscord} className="flex flex-col gap-3">
            {esRegistro && <input type="hidden" name="codigo" value={codigo} />}
            <Button type="submit" variante="perfil" tamano="lg" className="w-full">
              Continuar con Discord
            </Button>
            {estadoDiscord?.error && <Aviso tono="error">{estadoDiscord.error}</Aviso>}
          </form>
        </>
      )}

      {/* Vale para las dos vias: crear la cuenta con Discord tambien es
          registrarse. */}
      {esRegistro && (
        <p className="text-muted-foreground mt-5 text-center text-xs leading-relaxed">
          Al crear la cuenta aceptas las{' '}
          <Link href="/condiciones" className="text-primary hover:underline">
            condiciones de reserva
          </Link>{' '}
          y la{' '}
          <Link href="/privacidad" className="text-primary hover:underline">
            política de privacidad
          </Link>
          .
        </p>
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
