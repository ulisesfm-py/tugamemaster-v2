import type { Metadata } from 'next';

import { RepartoEjemplo } from '@/components/reparto-ejemplo';
import { EnlaceBoton } from '@/components/ui';
import { COMISION_ESTANDAR, porcentaje } from '@/modules/payments/dinero';
import { HORAS_DE_RETENCION } from '@/modules/payments/libro';

const COMISION = porcentaje(COMISION_ESTANDAR);

export const metadata: Metadata = {
  title: 'Dirigir en TuGameMaster',
  description: `Cobra por dirigir tus partidas. Comisión del ${COMISION}%, sin cuota mensual: si un mes no diriges, no pagas nada.`,
};

/**
 * Captacion de game masters.
 *
 * Lo que decide a alguien a abrir mesa aqui no es una promesa, son tres
 * numeros: cuanto se lleva, cuando lo cobra y que pasa si algo sale mal. Esta
 * pagina los dice antes que nada, y los saca del codigo que los aplica.
 */

const PASOS = [
  {
    titulo: 'Creas tu perfil',
    texto:
      'Un titular, cómo diriges y en qué idiomas. Es lo que ve quien está decidiendo si sentarse contigo.',
    href: '/cuenta/gm',
    boton: 'Crear mi perfil',
  },
  {
    titulo: 'Das de alta dónde cobrar',
    texto:
      'Lo gestiona Stripe, no nosotros: te pide tus datos y la cuenta donde ingresar. TuGameMaster no llega a verlos ni a guardarlos.',
    href: '/cuenta/cobros',
    boton: 'Configurar cobros',
  },
  {
    titulo: 'Publicas tu primera mesa',
    texto:
      'Fecha, plazas, precio y la ficha: qué se juega, para quién es y cuánta soltura hace falta. Nace como borrador, así que la revisas entera antes de que la vea nadie.',
    href: '/cuenta/partidas/nueva',
    boton: 'Crear una partida',
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

export default function ParaGameMastersPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="font-heading text-foreground text-3xl font-extrabold text-balance sm:text-4xl">
        Cobra por dirigir
      </h1>
      <p className="text-muted-foreground mt-3 text-lg">
        Tú pones la mesa. Nosotros cobramos, guardamos el dinero hasta que se juega y te
        lo transferimos.
      </p>

      <RepartoEjemplo className="mt-8" />

      <Bloque titulo="Qué cuesta">
        <p>
          Una <strong className="text-foreground">comisión del {COMISION}%</strong> sobre
          lo que cobras, y el coste que la pasarela nos cobra por mover ese dinero. Nada
          más: no hay cuota mensual ni permanencia, así que{' '}
          <strong className="text-foreground">un mes que no dirijas no pagas nada</strong>
          .
        </p>
        <p>
          La comisión se congela en cada reserva en el momento del cobro. Si algún día
          cambiamos el porcentaje, tus partidas ya vendidas conservan el que tenían.
        </p>
      </Bloque>

      <Bloque titulo="Cuándo cobras">
        <p>
          El jugador paga al reservar, pero ese dinero no te llega todavía: queda retenido
          por nosotros. Se te transfiere{' '}
          <strong className="text-foreground">
            {HORAS_DE_RETENCION} horas después de terminar la partida
          </strong>
          , si nadie ha reportado ninguna incidencia.
        </p>
        <p>
          Esa espera también te protege a ti: es lo que permite decirle a quien reserva
          que su dinero está a salvo, y por tanto lo que hace que reserve.
        </p>
        <p>
          Todo el recorrido se ve en tus ingresos, mesa por mesa y asiento por asiento:
          quién pagó, cuánto se descontó y dónde está cada euro.
        </p>
      </Bloque>

      <Bloque titulo="Qué te llevas además del dinero">
        <p>
          Una reputación que no se puede fingir. Las estrellas y el recuento de partidas
          salen <strong className="text-foreground">solo</strong> de mesas reservadas y
          pagadas aquí: valora quien pagó su plaza y jugó, nadie más.
        </p>
        <p>
          Tu perfil enseña también cuánta gente distinta ha pasado por tus mesas y cuánta
          ha repetido. Que alguien vuelva es la señal más honesta que hay, y es tuya.
        </p>
      </Bloque>

      <Bloque titulo="Y si tienes que cancelar">
        <p>
          Puedes hacerlo, y quien había pagado recupera el 100% en saldo sin importar
          cuánto falte. Es lo justo: el plazo de cancelación existe para protegerte de
          quien se descuelga tarde, no al revés.
        </p>
        <p>
          Queda anotado en tu perfil, junto al resto de cifras. Un game master que no
          cancela nunca merece que se sepa.
        </p>
      </Bloque>

      <section className="mt-14">
        <h2 className="font-heading text-foreground text-2xl font-bold">
          Cómo se empieza
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
              <div className="min-w-0">
                <h3 className="font-heading text-foreground font-bold">{paso.titulo}</h3>
                <p className="text-muted-foreground mt-1">{paso.texto}</p>
                <div className="mt-3">
                  <EnlaceBoton href={paso.href} variante="perfil" tamano="sm">
                    {paso.boton}
                  </EnlaceBoton>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <div className="mt-12">
        <EnlaceBoton href="/cuenta/gm" tamano="lg">
          Abrir mi mesa
        </EnlaceBoton>
      </div>
    </main>
  );
}
