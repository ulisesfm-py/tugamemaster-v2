import 'server-only';

import { Resend } from 'resend';

/**
 * Envio de correo transaccional.
 *
 * **Sin `RESEND_API_KEY` la aplicacion funciona igual**: el correo se compone
 * entero y se vuelca al registro en vez de enviarse. Asi se puede desarrollar y
 * verificar el contenido y el momento de cada aviso sin cuenta de Resend ni
 * dominio verificado. Es el mismo criterio que ya se aplica a Discord y a
 * Vercel Blob.
 */

export type Correo = {
  para: string;
  asunto: string;
  /** Version en texto plano. Obligatoria: hay quien lee el correo asi. */
  texto: string;
  html: string;
};

/** True si hay credenciales para enviar de verdad. */
export function emailEnabled(): boolean {
  return Boolean(process.env['RESEND_API_KEY'] && process.env['EMAIL_FROM']);
}

let cliente: Resend | undefined;

function resend(): Resend {
  cliente ??= new Resend(process.env['RESEND_API_KEY']);
  return cliente;
}

/**
 * Envia un correo. **Nunca lanza.**
 *
 * Un aviso que falla no puede tumbar la operacion que lo provoca: si Resend
 * esta caido, el jugador ha pagado igual y su plaza es suya. El fallo se
 * registra y se sigue. Devuelve si se llego a enviar, sobre todo para poder
 * comprobarlo en las pruebas.
 */
export async function enviarCorreo(correo: Correo): Promise<boolean> {
  if (!emailEnabled()) {
    console.info(
      [
        '',
        '--- CORREO (no enviado: falta RESEND_API_KEY o EMAIL_FROM) ---',
        `Para:    ${correo.para}`,
        `Asunto:  ${correo.asunto}`,
        '',
        correo.texto,
        '--- fin del correo ---',
        '',
      ].join('\n'),
    );

    return false;
  }

  try {
    const respuesta = await resend().emails.send({
      from: process.env['EMAIL_FROM'] as string,
      to: correo.para,
      subject: correo.asunto,
      text: correo.texto,
      html: correo.html,
    });

    if (respuesta.error) {
      console.error(`Resend rechazo el correo a ${correo.para}:`, respuesta.error);
      return false;
    }

    return true;
  } catch (error) {
    console.error(`Fallo al enviar el correo a ${correo.para}:`, error);
    return false;
  }
}

/** Direccion publica de la aplicacion, para los enlaces de los correos. */
export function urlBase(): string {
  return process.env['AUTH_URL']?.replace(/\/$/, '') ?? 'http://localhost:3000';
}
