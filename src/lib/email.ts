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

/**
 * Direccion a la que desviar **todo** el correo, si esta configurada.
 *
 * Para desarrollo. Los usuarios de prueba tienen direcciones inventadas
 * (`ana@tugamemaster.test`): enviarles de verdad genera rebotes duros, que es
 * lo que mas castiga la reputacion de un remitente. Con el desvio puesto, los
 * correos llegan a un buzon real y el asunto dice a quien iban.
 */
function desvio(): string | undefined {
  return process.env['EMAIL_REDIRECT_TO'] || undefined;
}

/**
 * Aplica el desvio, si lo hay.
 *
 * En produccion se respeta igualmente —los despliegues de vista previa son un
 * uso legitimo— pero se avisa por registro, porque tener esto puesto sin
 * querer significa que ningun usuario recibe su correo.
 */
function destino(correo: Correo): Correo {
  const a = desvio();
  if (!a) return correo;

  if (process.env.NODE_ENV === 'production') {
    console.warn(
      `EMAIL_REDIRECT_TO esta configurado en produccion: el correo para ` +
        `${correo.para} se envia a ${a} y su destinatario no lo recibira.`,
    );
  }

  return { ...correo, para: a, asunto: `[para: ${correo.para}] ${correo.asunto}` };
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

  const salida = destino(correo);

  try {
    const respuesta = await resend().emails.send({
      from: process.env['EMAIL_FROM'] as string,
      to: salida.para,
      subject: salida.asunto,
      text: salida.texto,
      html: salida.html,
    });

    if (respuesta.error) {
      console.error(`Resend rechazo el correo a ${salida.para}:`, respuesta.error);
      return false;
    }

    return true;
  } catch (error) {
    console.error(`Fallo al enviar el correo a ${salida.para}:`, error);
    return false;
  }
}

/** Direccion publica de la aplicacion, para los enlaces de los correos. */
export function urlBase(): string {
  return process.env['AUTH_URL']?.replace(/\/$/, '') ?? 'http://localhost:3000';
}
