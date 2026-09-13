import 'server-only';

import Stripe from 'stripe';

/**
 * Cliente de Stripe de la plataforma.
 *
 * Solo se instancia desde `src/modules/payments` (ver CLAUDE.md): ningun otro
 * modulo importa el SDK.
 */

let cliente: Stripe | undefined;

export function stripe(): Stripe {
  if (cliente) return cliente;

  const clave = process.env['STRIPE_SECRET_KEY'];

  if (!clave) {
    throw new Error(
      'Falta STRIPE_SECRET_KEY. Ver docs/environment_setup.md para obtenerla.',
    );
  }

  cliente = new Stripe(clave, {
    // Fijar la version de la API evita que un cambio del lado de Stripe altere
    // el comportamiento sin que nosotros toquemos nada.
    apiVersion: '2026-08-26.dahlia',
    appInfo: { name: 'TuGameMaster' },
  });

  return cliente;
}

/** True si Stripe esta configurado. Sin claves la app arranca igual. */
export function stripeEnabled(): boolean {
  return Boolean(process.env['STRIPE_SECRET_KEY']);
}

/**
 * URL base de la aplicacion, para construir los enlaces de vuelta de Stripe.
 *
 * En Vercel, VERCEL_PROJECT_PRODUCTION_URL apunta al dominio de produccion; en
 * local se usa AUTH_URL, que ya define el entorno de desarrollo.
 */
export function urlBase(): string {
  const explicita = process.env['AUTH_URL'];
  if (explicita) return explicita.replace(/\/$/, '');

  const vercel = process.env['VERCEL_PROJECT_PRODUCTION_URL'];
  if (vercel) return `https://${vercel}`;

  return 'http://localhost:3000';
}
