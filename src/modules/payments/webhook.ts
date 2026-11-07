import type Stripe from 'stripe';

/**
 * Verificacion de la firma de los webhooks de Stripe.
 *
 * En produccion hay **dos destinos** apuntando a la misma URL, y cada uno
 * firma con su propio secreto:
 *
 * - el de la cuenta de la plataforma: los cobros (`payment_intent.*`,
 *   `checkout.session.*`);
 * - el de las cuentas conectadas: el alta de los game masters
 *   (`account.updated`), que es un evento de la cuenta del GM, no de la
 *   nuestra.
 *
 * En local no se nota, porque `stripe listen` lo reenvia todo firmado con un
 * unico secreto. Por eso el segundo es opcional.
 */

/** Los secretos configurados, sin huecos. */
export function secretosDeWebhook(
  entorno: Record<string, string | undefined> = process.env,
): string[] {
  return [entorno['STRIPE_WEBHOOK_SECRET'], entorno['STRIPE_WEBHOOK_SECRET_CONNECT']]
    .map((s) => s?.trim() ?? '')
    .filter((s) => s.length > 0);
}

/**
 * Devuelve el evento si la firma cuadra con alguno de los secretos, o `null`
 * si no cuadra con ninguno.
 *
 * Probar los dos no debilita nada: una firma valida para cualquiera de ellos
 * solo la puede producir Stripe.
 */
export async function verificarEvento(
  webhooks: Stripe['webhooks'],
  cuerpo: string,
  firma: string,
  secretos: readonly string[],
): Promise<Stripe.Event | null> {
  for (const secreto of secretos) {
    try {
      return await webhooks.constructEventAsync(cuerpo, firma, secreto);
    } catch {
      // No es este; se prueba el siguiente.
    }
  }

  return null;
}
