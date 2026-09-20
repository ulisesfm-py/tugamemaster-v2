'use server';

import { revalidatePath } from 'next/cache';

import type { EstadoAccion } from '@/lib/acciones';
import { auth } from '@/lib/auth';
import { devolverADinero } from '@/modules/payments/devoluciones';

import { aprobarIncidencia, rechazarIncidencia, reportarIncidencia } from './service';

/** Comprueba que quien llama es administrador. */
async function exigirAdmin() {
  const session = await auth();

  // No basta con el middleware: una accion de servidor es un endpoint por si
  // misma y podria invocarse directamente.
  if (!session?.user?.isAdmin) return null;

  return session.user;
}

export async function reportarIncidenciaAction(
  _previo: EstadoAccion,
  formData: FormData,
): Promise<EstadoAccion> {
  const session = await auth();
  if (!session?.user) return { error: 'Tienes que iniciar sesión' };

  const resultado = await reportarIncidencia(
    String(formData.get('bookingId') ?? ''),
    session.user.id,
    String(formData.get('motivo') ?? ''),
  );

  if (!resultado.ok) return { error: resultado.mensaje };

  revalidatePath('/mis-reservas');
  revalidatePath('/admin/incidencias');

  return {
    ok: true,
    mensaje:
      'Incidencia enviada. La revisaremos y el pago al game master queda detenido.',
  };
}

export async function aprobarIncidenciaAction(
  _previo: EstadoAccion,
  formData: FormData,
): Promise<EstadoAccion> {
  const admin = await exigirAdmin();
  if (!admin) return { error: 'No tienes permiso' };

  const resultado = await aprobarIncidencia(
    String(formData.get('incidentId') ?? ''),
    admin.id,
    String(formData.get('nota') ?? ''),
  );

  if (!resultado.ok) return { error: resultado.mensaje };

  revalidatePath('/admin/incidencias');
  revalidatePath('/mis-reservas');

  return { ok: true, mensaje: 'Aprobada. Se ha abonado el 100% en saldo.' };
}

export async function rechazarIncidenciaAction(
  _previo: EstadoAccion,
  formData: FormData,
): Promise<EstadoAccion> {
  const admin = await exigirAdmin();
  if (!admin) return { error: 'No tienes permiso' };

  const resultado = await rechazarIncidencia(
    String(formData.get('incidentId') ?? ''),
    admin.id,
    String(formData.get('nota') ?? ''),
  );

  if (!resultado.ok) return { error: resultado.mensaje };

  revalidatePath('/admin/incidencias');

  return { ok: true, mensaje: 'Desestimada. El pago al game master sigue su curso.' };
}

export async function devolverADineroAction(
  _previo: EstadoAccion,
  formData: FormData,
): Promise<EstadoAccion> {
  const admin = await exigirAdmin();
  if (!admin) return { error: 'No tienes permiso' };

  try {
    const resultado = await devolverADinero(
      String(formData.get('bookingId') ?? ''),
      admin.id,
      String(formData.get('nota') ?? ''),
    );

    if (!resultado.ok) return { error: resultado.mensaje };

    revalidatePath('/admin/incidencias');

    return {
      ok: true,
      mensaje: `Devueltos ${(resultado.devueltoCents / 100).toFixed(2)} EUR a la tarjeta.`,
    };
  } catch (error) {
    console.error('Fallo al devolver a la tarjeta:', error);
    return { error: 'Stripe rechazó la devolución. Revisa el panel de Stripe.' };
  }
}
