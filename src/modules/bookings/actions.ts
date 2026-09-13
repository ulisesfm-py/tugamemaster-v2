'use server';

import { revalidatePath } from 'next/cache';

import type { EstadoAccion } from '@/lib/acciones';
import { auth } from '@/lib/auth';

import { unstable_rethrow } from 'next/navigation';
import { redirect } from 'next/navigation';

import { crearSesionDeCheckout } from '@/modules/payments/checkout';

import { cancelarReserva, reservarAsiento } from './service';

export type EstadoReserva = EstadoAccion;

export async function reservarAction(
  _previo: EstadoReserva,
  formData: FormData,
): Promise<EstadoReserva> {
  const session = await auth();
  if (!session?.user) return { error: 'Inicia sesion para reservar' };

  const gameId = String(formData.get('gameId') ?? '');
  const slug = String(formData.get('slug') ?? '');

  const resultado = await reservarAsiento(gameId, session.user.id);

  if (!resultado.ok) return { error: resultado.mensaje };

  revalidatePath(`/partidas/${slug}`);
  revalidatePath('/partidas');
  revalidatePath('/mis-reservas');

  // Una partida gratuita no pasa por Stripe: crear un cobro de cero euros
  // fallaria y no tendria ningun sentido.
  if (resultado.gratuita) {
    return { ok: true, mensaje: 'Plaza reservada. Esta partida es gratuita.' };
  }

  let destino: string;

  try {
    const pago = await crearSesionDeCheckout(resultado.bookingId);
    if (!pago.ok) return { error: pago.mensaje };
    destino = pago.url;
  } catch (error) {
    unstable_rethrow(error);
    console.error('No se pudo crear la sesion de pago:', error);
    return {
      error:
        'Tu plaza esta guardada, pero no hemos podido abrir el pago. ' +
        'Intentalo de nuevo desde Mis reservas.',
    };
  }

  // La pantalla de pago esta en stripe.com.
  redirect(destino);
}

export async function cancelarReservaAction(
  _previo: EstadoReserva,
  formData: FormData,
): Promise<EstadoReserva> {
  const session = await auth();
  if (!session?.user) return { error: 'Tienes que iniciar sesion' };

  const resultado = await cancelarReserva(
    String(formData.get('bookingId') ?? ''),
    session.user.id,
  );

  if (!resultado.ok) return { error: resultado.mensaje };

  revalidatePath('/mis-reservas');
  revalidatePath('/partidas');

  const slug = String(formData.get('slug') ?? '');
  if (slug) revalidatePath(`/partidas/${slug}`);

  return { ok: true, mensaje: 'Reserva cancelada.' };
}
