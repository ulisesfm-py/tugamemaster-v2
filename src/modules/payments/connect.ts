import 'server-only';

import type Stripe from 'stripe';

import { db } from '@/lib/db';
import { stripe, urlBase } from '@/lib/stripe';

/**
 * Alta de los game masters en Stripe Connect.
 *
 * Se usan cuentas **Express**: Stripe se encarga del formulario de alta, de
 * pedir los datos y de comprobar lo que tenga que comprobar. Nosotros no
 * llegamos a tocar esos datos, que es exactamente lo que queremos.
 *
 * El modelo de cobro es *separate charges and transfers*: la plataforma cobra
 * al jugador y despues transfiere al GM. Por eso la cuenta conectada solo
 * necesita la capacidad `transfers`, no la de aceptar pagos con tarjeta.
 */

/** Estado del alta tal y como lo ve la aplicacion. */
export type EstadoCuenta = {
  /** Puede recibir transferencias: es lo que desbloquea publicar partidas. */
  payoutsEnabled: boolean;
  chargesEnabled: boolean;
  /** Ha terminado de rellenar el formulario de Stripe. */
  detailsSubmitted: boolean;
  /** Datos que Stripe todavia espera, si los hay. */
  pendiente: string[];
};

/**
 * Traduce una cuenta de Stripe al estado que guardamos.
 *
 * Funcion pura y exportada para poder probarla sin llamar a Stripe.
 */
export function leerEstado(cuenta: Stripe.Account): EstadoCuenta {
  const requisitos = cuenta.requirements;

  return {
    payoutsEnabled: cuenta.payouts_enabled === true,
    chargesEnabled: cuenta.charges_enabled === true,
    detailsSubmitted: cuenta.details_submitted === true,
    pendiente: [
      ...(requisitos?.currently_due ?? []),
      ...(requisitos?.past_due ?? []),
    ].filter((v, i, a) => a.indexOf(v) === i),
  };
}

export type ResultadoAlta = { ok: true; url: string } | { ok: false; mensaje: string };

/**
 * Devuelve el enlace al formulario de alta de Stripe, creando la cuenta
 * conectada si el GM aun no tiene ninguna.
 *
 * El enlace caduca en minutos y es de un solo uso, asi que se genera en cada
 * visita en vez de guardarse.
 */
export async function enlaceDeAlta(userId: string): Promise<ResultadoAlta> {
  const gm = await db.gmProfile.findUnique({
    where: { userId },
    select: { id: true, stripeAccountId: true },
  });

  if (!gm) {
    return { ok: false, mensaje: 'Antes tienes que crear tu perfil de game master' };
  }

  const usuario = await db.user.findUniqueOrThrow({
    where: { id: userId },
    select: { email: true },
  });

  let cuentaId = gm.stripeAccountId;

  if (!cuentaId) {
    const cuenta = await stripe().accounts.create({
      type: 'express',
      email: usuario.email,
      capabilities: { transfers: { requested: true } },
      business_type: 'individual',
      // Guardamos la referencia cruzada para poder identificar la cuenta
      // desde un webhook sin consultar nuestra base de datos por el email.
      metadata: { gmProfileId: gm.id, userId },
    });

    cuentaId = cuenta.id;

    await db.gmProfile.update({
      where: { id: gm.id },
      data: { stripeAccountId: cuentaId },
    });
  }

  const base = urlBase();

  const enlace = await stripe().accountLinks.create({
    account: cuentaId,
    // Si el enlace caduca antes de usarlo, Stripe manda aqui para pedir otro.
    refresh_url: `${base}/cuenta/cobros?refrescar=1`,
    return_url: `${base}/cuenta/cobros?vuelta=1`,
    type: 'account_onboarding',
  });

  return { ok: true, url: enlace.url };
}

/**
 * Relee el estado de la cuenta en Stripe y lo guarda.
 *
 * Los webhooks son la fuente de verdad, pero esta funcion existe para cuando
 * el GM vuelve del formulario: el webhook puede tardar unos segundos y seria
 * raro que la pagina siguiera diciendo que falta el alta.
 */
export async function sincronizarCuenta(
  stripeAccountId: string,
): Promise<EstadoCuenta | null> {
  const cuenta = await stripe().accounts.retrieve(stripeAccountId);
  return guardarEstado(stripeAccountId, cuenta);
}

/**
 * Vuelca en la base de datos el estado de una cuenta conectada.
 *
 * `onboardedAt` se escribe una sola vez, la primera vez que la cuenta queda
 * habilitada: es la fecha de alta, no la del ultimo cambio.
 */
export async function guardarEstado(
  stripeAccountId: string,
  cuenta: Stripe.Account,
): Promise<EstadoCuenta | null> {
  const estado = leerEstado(cuenta);

  const gm = await db.gmProfile.findUnique({
    where: { stripeAccountId },
    select: { id: true, onboardedAt: true },
  });

  // Puede llegar un webhook de una cuenta que no es nuestra o que ya se
  // borro: no es un error, simplemente no hay nada que actualizar.
  if (!gm) return null;

  await db.gmProfile.update({
    where: { id: gm.id },
    data: {
      chargesEnabled: estado.chargesEnabled,
      payoutsEnabled: estado.payoutsEnabled,
      onboardedAt: gm.onboardedAt ?? (estado.payoutsEnabled ? new Date() : null),
    },
  });

  return estado;
}

/** Estado guardado del GM, sin llamar a Stripe. */
export async function estadoGuardado(userId: string) {
  return db.gmProfile.findUnique({
    where: { userId },
    select: {
      stripeAccountId: true,
      chargesEnabled: true,
      payoutsEnabled: true,
      onboardedAt: true,
    },
  });
}
