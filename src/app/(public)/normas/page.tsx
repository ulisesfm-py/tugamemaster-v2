import type { Metadata } from 'next';
import Link from 'next/link';

import { Correo, PaginaLegal, SeccionLegal } from '@/components/pagina-legal';
import { TITULAR } from '@/lib/titular';

export const metadata: Metadata = {
  title: 'Normas de convivencia · TuGameMaster',
  description:
    'Cómo esperamos que se trate la gente en TuGameMaster y qué puede pasar si no se cumple.',
};

/**
 * Las normas de convivencia.
 *
 * Valen para jugadores y game masters. Estan escritas a partir de lo que la web
 * ya protege —reputacion que solo sale de mesas pagadas aqui, incidencias que
 * detienen un pago, un codigo de fundador que solo empareja cuentas nuevas— y
 * no inventan mecanismos que no existen: lo que dicen que puede pasar es un
 * derecho de la plataforma, no una promesa de un boton automatico.
 *
 * Son la referencia de la frase «normas de comportamiento de la web» de
 * `/fundadores`. Si se cambian, se actualiza `REVISION_TEXTOS_LEGALES`.
 */

export default function NormasPage() {
  return (
    <PaginaLegal
      titulo="Normas de convivencia"
      entradilla="Pocas y sencillas. Valen para quien juega y para quien dirige."
    >
      <SeccionLegal titulo="Trato">
        <ul className="flex list-disc flex-col gap-2 pl-5">
          <li>
            Respeto a todo el mundo, en las partidas y también en el hilo de cada mesa,
            los comentarios, las reseñas y los mensajes. No toleramos el acoso, los
            insultos, las amenazas ni la discriminación.
          </li>
          <li>
            Cada partida indica una edad mínima y a qué público va dirigida. Respétalas.
          </li>
          <li>
            Nadie debe sentirse incómodo en una mesa. Si dirigiendo o jugando alguien te
            pide parar, para.
          </li>
        </ul>
      </SeccionLegal>

      <SeccionLegal titulo="Verdad">
        <ul className="flex list-disc flex-col gap-2 pl-5">
          <li>
            Usa tu nombre y tus datos reales y no te hagas pasar por otra persona, por un
            game master que no eres tú ni por la web.
          </li>
          <li>
            Una persona, una cuenta. No crees cuentas adicionales para saltarte las reglas
            de devoluciones, de comisiones o de reseñas.
          </li>
          <li>
            Cuenta la partida como es: lo que se juega, cuándo, para quién y a qué precio.
          </li>
        </ul>
      </SeccionLegal>

      <SeccionLegal titulo="Reseñas y reputación">
        <p>
          Las estrellas y las partidas dirigidas de un game master salen solo de mesas
          reservadas, pagadas y jugadas aquí. Eso es lo que las hace valer, y por eso:
        </p>
        <ul className="flex list-disc flex-col gap-2 pl-5">
          <li>
            Valora solo lo que has jugado, con lo que de verdad pasó. No compres, ofrezcas
            ni intercambies reseñas.
          </li>
          <li>
            No intentes inflar ni hundir la reputación de nadie, ni desde una cuenta
            propia ni desde otras.
          </li>
          <li>
            Una queja seria sobre una partida no va en una reseña: se abre una incidencia
            desde Mis reservas.
          </li>
        </ul>
      </SeccionLegal>

      <SeccionLegal titulo="Reservas, pagos e incidencias">
        <ul className="flex list-disc flex-col gap-2 pl-5">
          <li>
            Las plazas de las partidas publicadas aquí se reservan y se pagan aquí. No
            pidas a un jugador que pague por otra vía una plaza que has publicado en la
            web, ni desvíes un cobro para evitar la comisión.
          </li>
          <li>
            Las incidencias son para cuando algo ha ido mal de verdad. Una incidencia
            abierta detiene el pago al game master, así que abrirla sin motivo, o con
            información falsa, es una infracción. También lo es presionar a alguien para
            que no abra una incidencia justificada.
          </li>
          <li>
            El código de invitación de un fundador solo sirve para crear una cuenta nueva.
            No se usa para emparejar a un jugador que ya conocía la web por su cuenta.
          </li>
        </ul>
      </SeccionLegal>

      <SeccionLegal titulo="Qué puede pasar si no se cumple">
        <p>
          Según la gravedad, podemos retirar un contenido (un comentario, un mensaje, una
          reseña o una partida), avisarte, limitar lo que puedes hacer en la web y, si es
          grave o se repite, cerrar tu cuenta.
        </p>
        <p>
          A los game masters fundadores, además, podemos retirarles la condición de
          fundador; lo explica{' '}
          <Link href="/fundadores" className="text-primary hover:underline">
            la página de fundadores
          </Link>
          .
        </p>
        <p>
          Salvo que sea grave, primero te lo diremos. Lo que ya esté pagado se resuelve
          según las{' '}
          <Link href="/condiciones" className="text-primary hover:underline">
            condiciones de reserva
          </Link>
          .
        </p>
        <p>
          Si crees que nos hemos equivocado, escríbenos a{' '}
          <Correo direccion={TITULAR.correo} /> y lo revisamos.
        </p>
      </SeccionLegal>
    </PaginaLegal>
  );
}
