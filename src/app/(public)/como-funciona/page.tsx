import type { Metadata } from 'next';
import Link from 'next/link';

import { EnlaceBoton } from '@/components/ui';
import {
  HORAS_CANCELACION_CON_DEVOLUCION,
  PORCENTAJE_DEVOLUCION,
  PORCENTAJE_DEVOLUCION_INCIDENCIA,
} from '@/modules/bookings/politica';
import { HORAS_DE_RETENCION } from '@/modules/payments/libro';

export const metadata: Metadata = {
  title: 'Cómo funciona · TuGameMaster',
  description: `Reservas tu plaza, juegas y valoras. Si cancelas a tiempo recuperas el ${PORCENTAJE_DEVOLUCION}% en saldo, y si el game master no aparece, todo.`,
};

/**
 * Para quien duda antes de pagar.
 *
 * Toda la pagina responde a una sola pregunta —«¿que pasa con mi dinero?»— y
 * por eso los numeros salen de `politica.ts`, que es el codigo que los aplica.
 * Una pagina de confianza que se contradiga con lo que hace el sistema es peor
 * que no tenerla.
 */

const PASOS = [
  {
    titulo: 'Buscas una mesa',
    texto:
      'Cada partida dice su sistema, su fecha, cuánto dura, en qué idioma se juega y cuánta soltura se presupone. La idea es que sepas si encaja contigo antes de entrar.',
  },
  {
    titulo: 'Reservas tu plaza y pagas',
    texto:
      'El pago va con tarjeta, en el momento. Tu plaza queda guardada y el game master sabe que cuenta contigo.',
  },
  {
    titulo: 'Juegas',
    texto:
      'El game master te dice dónde y cómo. Nosotros no nos metemos en la mesa: solo en que llegues a ella y en que el dinero acabe donde debe.',
  },
  {
    titulo: 'Valoras',
    texto:
      'Solo puede valorar quien reservó y jugó. Por eso las estrellas de un game master significan algo.',
  },
];

function Bloque({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="mt-12">
      <h2 className="font-heading text-foreground text-2xl font-bold">{titulo}</h2>
      <div className="text-muted-foreground mt-4 flex flex-col gap-3 leading-relaxed">
        {children}
      </div>
    </section>
  );
}

export default function ComoFuncionaPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="font-heading text-foreground text-3xl font-extrabold text-balance sm:text-4xl">
        Cómo funciona
      </h1>
      <p className="text-muted-foreground mt-3 text-lg">
        Reservas una tarde, no te suscribes a nada, y si algo sale mal recuperas tu
        dinero.
      </p>

      {/* Los pasos cuelgan de su propio h2: asi el esquema de la pagina no
          mezcla «Buscas una mesa» con «Qué pasa con tu dinero», que no estan
          al mismo nivel aunque lo parezcan. */}
      <section className="mt-10">
        <h2 className="font-heading text-foreground text-2xl font-bold">
          En cuatro pasos
        </h2>

        <ol className="mt-6 flex flex-col gap-6">
          {PASOS.map((paso, i) => (
            <li key={paso.titulo} className="flex gap-4">
              <span
                aria-hidden
                className="border-border text-primary font-heading grid size-9 shrink-0 place-items-center rounded-full border font-bold"
              >
                {i + 1}
              </span>
              <div>
                <h3 className="font-heading text-foreground font-bold">{paso.titulo}</h3>
                <p className="text-muted-foreground mt-1">{paso.texto}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <Bloque titulo="Qué pasa con tu dinero">
        <p>
          Cuando pagas, el dinero <strong className="text-foreground">no va</strong> al
          game master: se queda retenido por TuGameMaster. Solo se le transfiere{' '}
          {HORAS_DE_RETENCION} horas después de que termine la partida, y únicamente si
          nadie ha reportado ninguna incidencia.
        </p>
        <p>
          Esa espera es justo lo que hace que reclamar sirva de algo: mientras el dinero
          siga aquí, se puede devolver.
        </p>
      </Bloque>

      <Bloque titulo="Si no puedes ir">
        <p>
          Con más de {HORAS_CANCELACION_CON_DEVOLUCION} horas de antelación recuperas el{' '}
          <strong className="text-foreground">{PORCENTAJE_DEVOLUCION}%</strong> en saldo.
          El {100 - PORCENTAJE_DEVOLUCION}% restante cubre los gastos de gestión.
        </p>
        <p>
          Dentro de esas últimas {HORAS_CANCELACION_CON_DEVOLUCION} horas puedes liberar
          la plaza igualmente —y ojalá lo hagas, para que la ocupe otra persona— pero ya
          no hay devolución: el game master ha preparado la partida contando contigo.
        </p>
      </Bloque>

      <Bloque titulo="Si falla el game master">
        <p>
          Si cancela él, recuperas el{' '}
          <strong className="text-foreground">{PORCENTAJE_DEVOLUCION_INCIDENCIA}%</strong>
          , sin que importe cuánto faltara para jugar. El plazo de{' '}
          {HORAS_CANCELACION_CON_DEVOLUCION} horas existe para protegerle de quien se
          descuelga tarde; cuando el que se descuelga es él, aplicarlo sería cobrarte un
          plantón ajeno.
        </p>
        <p>
          Si no aparece, o la partida no es lo que decía, puedes abrir una incidencia
          desde{' '}
          <Link href="/mis-reservas" className="text-primary hover:underline">
            Mis reservas
          </Link>
          . La revisa una persona, y mientras tanto el pago al game master queda detenido.
        </p>
      </Bloque>

      <Bloque titulo="El saldo">
        <p>
          Las devoluciones se abonan como saldo, no vuelven a la tarjeta. Es una decisión
          deliberada: al devolver un cobro, la pasarela no nos devuelve su comisión, y ese
          coste tendría que asumirlo alguien. Si el dinero no sale de la plataforma, ese
          problema no existe.
        </p>
        <p>
          El saldo <strong className="text-foreground">no caduca</strong> y se aplica solo
          en tu siguiente reserva: si cubre el precio entero, no hace falta ni sacar la
          tarjeta. Si prefieres recuperarlo de verdad, escríbenos y lo revisamos.
        </p>
      </Bloque>

      <div className="mt-12 flex flex-wrap gap-3">
        <EnlaceBoton href="/partidas" tamano="lg">
          Ver mesas abiertas
        </EnlaceBoton>
        <EnlaceBoton href="/condiciones" variante="perfil" tamano="lg">
          Leer las condiciones
        </EnlaceBoton>
      </div>
    </main>
  );
}
