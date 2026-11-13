import type { Metadata } from 'next';

import { EnlaceBoton, Fundador } from '@/components/ui';
import { MESES_DE_VALIDEZ, PLAZAS_DE_FUNDADOR } from '@/modules/invitaciones/politica';
import {
  COMISION_ESTANDAR,
  COMISION_FUNDADOR,
  COMISION_FUNDADOR_ENLACE,
  porcentaje,
} from '@/modules/payments/dinero';

export const metadata: Metadata = {
  title: 'Game masters fundadores · TuGameMaster',
  description: `Los primeros ${PLAZAS_DE_FUNDADOR} game masters de TuGameMaster pagan una comisión del ${porcentaje(COMISION_FUNDADOR)}% por los jugadores que trae la web y del ${porcentaje(COMISION_FUNDADOR_ENLACE)}% por los suyos.`,
};

/**
 * Las condiciones de los game masters fundadores, por escrito.
 *
 * Existe para que lo que se promete en una conversacion se pueda leer aqui, y
 * para que alguien que mire la web antes de fiarse no encuentre solo el 10 %
 * de `/para-game-masters` y piense que le han contado otra cosa.
 *
 * Los porcentajes salen de `payments/dinero.ts`, que es donde se aplican: esta
 * pagina no puede decir una cifra distinta de la que cobra la web. No lleva
 * ejemplos con importes: el coste real de la pasarela lo fija Stripe en cada
 * cobro y aqui no se promete.
 */

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

const CONDICIONES = [
  {
    quien: 'Un jugador que se registró con el código del fundador',
    valor: COMISION_FUNDADOR_ENLACE,
    destacado: true,
  },
  {
    quien: 'Un jugador que llegó por la web',
    valor: COMISION_FUNDADOR,
    destacado: true,
  },
  {
    quien: 'Para comparar: cualquier otro game master, con cualquier jugador',
    valor: COMISION_ESTANDAR,
    destacado: false,
  },
] as const;

export default function FundadoresPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <Fundador />
      <h1 className="font-heading text-foreground mt-4 text-3xl font-extrabold text-balance sm:text-4xl">
        Game masters fundadores
      </h1>
      <p className="text-muted-foreground mt-3 text-lg">
        Son los primeros {PLAZAS_DE_FUNDADOR} game masters de TuGameMaster, nombrados a
        mano. Pagan menos comisión, y lo conservan.
      </p>

      <Bloque titulo="Qué pagan">
        <p>
          Una comisión que depende de quién reserva. Se calcula sobre lo que cobra el game
          master y se fija en el momento de cada reserva.
        </p>

        <table className="border-border mt-2 w-full border-y text-left text-sm">
          <caption className="sr-only">Comisión de un game master fundador</caption>
          <thead>
            <tr className="text-muted-foreground text-xs tracking-widest uppercase">
              <th scope="col" className="py-2 pr-4 font-semibold">
                Quién reserva
              </th>
              <th scope="col" className="py-2 text-right font-semibold">
                Comisión
              </th>
            </tr>
          </thead>
          <tbody className="divide-border divide-y">
            {CONDICIONES.map((fila) => (
              <tr key={fila.quien}>
                <th
                  scope="row"
                  className={`py-3 pr-4 font-normal ${
                    fila.destacado ? 'text-foreground' : 'text-muted-foreground italic'
                  }`}
                >
                  {fila.quien}
                </th>
                <td
                  className={`font-heading py-3 text-right text-lg font-bold tabular-nums ${
                    fila.destacado ? 'text-primary' : 'text-muted-foreground'
                  }`}
                >
                  {porcentaje(fila.valor)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <p>
          El coste de la plataforma de pago se descuenta siempre del cobro, sea cual sea
          la comisión. Es el coste real de cada pago, no una estimación. No hay cuota
          mensual ni permanencia: un mes que no diriges no pagas nada.
        </p>
        <p>
          <strong className="text-foreground">Estas condiciones son permanentes.</strong>{' '}
          No suben aunque cambie la política general para el resto de game masters. Y una
          reserva ya hecha conserva siempre la comisión con la que se vendió.
        </p>
      </Bloque>

      <Bloque titulo="El código de invitación">
        <p>
          Cada fundador tiene un código y un enlace propios. Quien crea su cuenta con
          ellos queda como jugador suyo, y por sus plazas el fundador paga un{' '}
          {porcentaje(COMISION_FUNDADOR_ENLACE)}%.
        </p>
        <ul className="flex list-disc flex-col gap-2 pl-5">
          <li>
            El emparejamiento se guarda en la cuenta del jugador al crearla, no en el
            navegador: vale aunque abra el enlace en el móvil y se registre en el
            ordenador.
          </li>
          <li>
            <strong className="text-foreground">
              Una cuenta que ya existe no se puede emparejar después.
            </strong>{' '}
            Así nadie se ahorra la comisión pasándole el código a un jugador que trajo la
            web.
          </li>
          <li>
            El código admite registros durante {MESES_DE_VALIDEZ} meses y se renueva
            cuando hace falta. Lo que caduca es el código, no el emparejamiento: quien ya
            se registró con él sigue siendo del fundador.
          </li>
        </ul>
      </Bloque>

      <Bloque titulo="Qué se les pide">
        <p>
          Peticiones, no condiciones: ninguna se paga con la comisión. Crear su perfil y
          dar de alta sus cobros, publicar una primera partida, poner su enlace donde ya
          les encuentran sus jugadores y contarnos, sin filtros, qué falla o qué falta.
        </p>
        <p>
          No se pide exclusividad, ni un mínimo de partidas, ni dejar de usar lo que ya
          usan: esto se suma a lo que hacen, no lo sustituye.
        </p>
      </Bloque>

      <Bloque titulo="Qué no prometemos">
        <p>
          <strong className="text-foreground">Ningún número de reservas.</strong> La web
          es nueva. Los fundadores traen a sus propios jugadores y la web irá sumando los
          suyos a medida que haya partidas con plazas libres. Tampoco prometemos ingresos
          concretos.
        </p>
      </Bloque>

      <Bloque titulo="Si dejan de ser fundadores">
        <p>
          Un administrador puede retirar la condición, a petición del game master o si
          incumple las normas de comportamiento de la web. En ese caso:
        </p>
        <ul className="flex list-disc flex-col gap-2 pl-5">
          <li>Las reservas ya hechas conservan su comisión.</li>
          <li>
            Las nuevas pasan al {porcentaje(COMISION_ESTANDAR)}%, también las de sus
            jugadores con código: el {porcentaje(COMISION_FUNDADOR_ENLACE)}% es una
            ventaja del plan, no algo suyo aparte.
          </li>
          <li>Su código deja de admitir registros y pierde el distintivo.</li>
        </ul>
        <p>
          Es un plan, no un rol: no cambia lo que un game master puede hacer en la web.
        </p>
      </Bloque>

      <Bloque titulo="Cómo se llega a ser fundador">
        <p>
          Los nombramos a mano y no se pide con un formulario. Si tienes dudas sobre estas
          condiciones, escríbenos.
        </p>
      </Bloque>

      <div className="mt-12 flex flex-wrap gap-3">
        <EnlaceBoton href="/contacto">Escribirnos</EnlaceBoton>
        <EnlaceBoton href="/para-game-masters" variante="perfil">
          Cómo funciona para el game master
        </EnlaceBoton>
      </div>
    </main>
  );
}
