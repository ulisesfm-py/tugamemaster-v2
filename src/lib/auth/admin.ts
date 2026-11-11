import 'server-only';

import { db } from '@/lib/db';

import { auth } from './index';

/**
 * Quien es administrador *ahora mismo*.
 *
 * `isAdmin` viaja tambien dentro del JWT de la sesion, pero ese valor se
 * fija al iniciar sesion y no cambia hasta que la sesion caduca: quitarle el
 * rol a alguien no tendria efecto durante semanas. Para decidir si se le
 * deja hacer algo de administrador (aprobar un reembolso, nombrar un
 * fundador, retirar un mensaje) se pregunta a la base de datos, que es quien
 * lo sabe. El flag del token queda solo como pista para la interfaz.
 */

export type Administrador = { id: string };

/** Devuelve al administrador de la sesion actual, o null si no lo es. */
export async function exigirAdmin(): Promise<Administrador | null> {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) return null;

  const usuario = await db.user.findUnique({
    where: { id },
    select: { isAdmin: true },
  });

  return usuario?.isAdmin === true ? { id } : null;
}
