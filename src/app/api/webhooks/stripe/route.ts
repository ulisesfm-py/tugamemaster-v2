import type Stripe from 'stripe';

import { stripe } from '@/lib/stripe';
import { guardarEstado } from '@/modules/payments/connect';

/**
 * Webhook de Stripe.
 *
 * Los webhooks son la fuente de verdad del estado (ver CLAUDE.md): la
 * respuesta de una llamada a la API puede quedarse obsoleta, y hay cambios
 * (una verificacion que Stripe completa horas despues) que solo llegan por
 * aqui.
 *
 * Reglas de este endpoint:
 *
 * - La firma se verifica SIEMPRE. Sin eso, cualquiera podria marcar su cuenta
 *   como verificada con un simple POST.
 * - Se responde 200 en cuanto el evento se ha procesado o se ha decidido
 *   ignorar. Un 500 hace que Stripe reintente, asi que solo se devuelve ante
 *   un fallo del que tenga sentido recuperarse.
 * - Un evento desconocido no es un error: Stripe envia mas tipos de los que
 *   escuchamos.
 */

export async function POST(request: Request): Promise<Response> {
  const secreto = process.env['STRIPE_WEBHOOK_SECRET'];

  if (!secreto) {
    console.error('Webhook de Stripe recibido sin STRIPE_WEBHOOK_SECRET configurado');
    return new Response('Webhook no configurado', { status: 500 });
  }

  const firma = request.headers.get('stripe-signature');
  if (!firma) return new Response('Falta la firma', { status: 400 });

  // El cuerpo debe leerse en crudo: cualquier reserializacion cambiaria los
  // bytes y la firma dejaria de cuadrar.
  const cuerpo = await request.text();

  let evento: Stripe.Event;

  try {
    evento = await stripe().webhooks.constructEventAsync(cuerpo, firma, secreto);
  } catch (error) {
    // Firma invalida: o el secreto no coincide o alguien esta probando suerte.
    console.warn('Firma de webhook invalida:', (error as Error).message);
    return new Response('Firma invalida', { status: 400 });
  }

  try {
    switch (evento.type) {
      case 'account.updated': {
        const cuenta = evento.data.object;
        await guardarEstado(cuenta.id, cuenta);
        break;
      }

      default:
        // Evento que no escuchamos. Se confirma para que Stripe no reintente.
        break;
    }
  } catch (error) {
    // Fallo nuestro al procesar: devolver 500 hace que Stripe reintente, que
    // es lo que queremos si por ejemplo la base de datos estaba caida.
    console.error(`Error procesando ${evento.type} (${evento.id}):`, error);
    return new Response('Error al procesar', { status: 500 });
  }

  return new Response(null, { status: 200 });
}
