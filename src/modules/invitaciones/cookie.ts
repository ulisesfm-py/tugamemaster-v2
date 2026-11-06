import 'server-only';

import { cookies } from 'next/headers';

/**
 * El codigo de invitacion, de viaje a Discord y de vuelta.
 *
 * Darse de alta con Discord es salir de la web y volver: el formulario se
 * queda atras, y con el lo que se habia escrito en el campo del codigo. Esta
 * cookie lo lleva ese rato, y nada mas.
 *
 * **No es el emparejamiento.** El emparejamiento se guarda en el usuario al
 * crear la cuenta, que es lo que lo hace independiente del dispositivo. La
 * cookie solo cubre los segundos que dura la ida y vuelta, en el mismo
 * navegador, y se borra al leerla.
 */

const NOMBRE = 'tgm_codigo_registro';

/** Diez minutos: de sobra para aceptar en Discord, poco para que se quede. */
const DURACION_SEGUNDOS = 600;

export async function guardarCodigoDeViaje(codigo: string): Promise<void> {
  (await cookies()).set(NOMBRE, codigo, {
    maxAge: DURACION_SEGUNDOS,
    httpOnly: true,
    // Lax y no Strict: la vuelta desde Discord es una navegacion que empieza
    // en otro dominio, y con Strict la cookie no viajaria en ella.
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  });
}

export async function olvidarCodigoDeViaje(): Promise<void> {
  (await cookies()).delete(NOMBRE);
}

/** Lee el codigo y lo borra: se usa una vez, al crear la cuenta. */
export async function recogerCodigoDeViaje(): Promise<string | null> {
  const almacen = await cookies();
  const codigo = almacen.get(NOMBRE)?.value ?? null;

  if (codigo) almacen.delete(NOMBRE);

  return codigo;
}
