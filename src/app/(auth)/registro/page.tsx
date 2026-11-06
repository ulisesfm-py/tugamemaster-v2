import type { Metadata } from 'next';

import { AuthForm } from '@/components/auth-form';
import { discordEnabled } from '@/lib/env';
import { formatearCodigo, normalizarCodigo } from '@/modules/invitaciones/politica';
import { buscarCodigo } from '@/modules/invitaciones/service';
import { LONGITUD_MINIMA_PASSWORD } from '@/modules/users/password';
import { entrarConDiscordAction, registrarAction } from '@/modules/users/actions';

export const metadata: Metadata = { title: 'Crear cuenta · TuGameMaster' };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

/**
 * Crear cuenta.
 *
 * Con `?codigo=` llega desde el enlace de un game master fundador (`/r/...`).
 * El codigo se comprueba aqui para decir de quien es antes de que la persona
 * escriba nada, y se deja puesto en el formulario. Quien lo trae apuntado de
 * otro sitio puede escribirlo a mano: el enlace es una comodidad, el campo es
 * lo que empareja.
 */
export default async function RegistroPage({ searchParams }: Props) {
  const { codigo } = await searchParams;
  const escrito = typeof codigo === 'string' ? codigo : '';

  // Se ensena como se lee, en dos bloques, aunque el enlace lo traiga junto.
  const normalizado = normalizarCodigo(escrito);
  const codigoInicial = normalizado ? formatearCodigo(normalizado) : escrito;

  const invitacion = codigoInicial ? await buscarCodigo(codigoInicial) : undefined;

  return (
    <AuthForm
      modo="registro"
      accion={registrarAction}
      accionDiscord={discordEnabled() ? entrarConDiscordAction : undefined}
      minimoPassword={LONGITUD_MINIMA_PASSWORD}
      codigoInicial={codigoInicial}
      invitacion={
        invitacion === undefined
          ? undefined
          : invitacion.ok
            ? { ok: true, nombre: invitacion.nombre }
            : { ok: false, mensaje: invitacion.mensaje }
      }
    />
  );
}
