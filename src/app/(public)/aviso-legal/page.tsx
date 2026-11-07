import type { Metadata } from 'next';
import Link from 'next/link';

import { Correo, PaginaLegal, SeccionLegal } from '@/components/pagina-legal';
import { TITULAR } from '@/lib/titular';

export const metadata: Metadata = {
  title: 'Aviso legal · TuGameMaster',
  description: 'Quién está detrás de TuGameMaster y cómo contactar.',
};

export default function AvisoLegalPage() {
  return (
    <PaginaLegal
      titulo="Aviso legal"
      entradilla="Quién está detrás de esta web, como exige la Ley 34/2002 de servicios de la sociedad de la información (LSSI)."
    >
      <SeccionLegal titulo="Titular">
        <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2">
          <dt className="text-foreground font-semibold">Nombre</dt>
          <dd>{TITULAR.nombre}</dd>
          <dt className="text-foreground font-semibold">NIF</dt>
          <dd>{TITULAR.nif}</dd>
          <dt className="text-foreground font-semibold">Domicilio</dt>
          <dd>{TITULAR.domicilio}</dd>
          <dt className="text-foreground font-semibold">Correo</dt>
          <dd>
            <Correo direccion={TITULAR.correo} />
          </dd>
          <dt className="text-foreground font-semibold">Web</dt>
          <dd>{TITULAR.dominio}</dd>
        </dl>
      </SeccionLegal>

      <SeccionLegal titulo="Qué es TuGameMaster">
        <p>
          TuGameMaster es un mercado en línea: los game masters publican partidas de rol y
          los jugadores reservan y pagan su plaza. TuGameMaster cobra el importe de la
          reserva, lo retiene hasta después de la partida y se lo transfiere al game
          master descontando su comisión.
        </p>
        <p>
          Cada partida la organiza y la dirige su game master, que es quien responde de su
          contenido. Lo que pasa con tu dinero si algo sale mal está en las{' '}
          <Link href="/condiciones" className="text-primary hover:underline">
            condiciones de reserva
          </Link>
          .
        </p>
      </SeccionLegal>

      <SeccionLegal titulo="Contenido que publican los usuarios">
        <p>
          Las fichas de partida, los perfiles, las reseñas y los comentarios los escriben
          sus autores. Si ves algo que vulnera derechos de terceros o la ley, escríbenos y
          lo retiramos en cuanto lo comprobemos.
        </p>
      </SeccionLegal>

      <SeccionLegal titulo="Propiedad intelectual">
        <p>
          El nombre, el logotipo y el diseño de la web son de TuGameMaster. Los nombres de
          los juegos de rol que aparecen en las partidas pertenecen a sus editores y se
          citan solo para describir a qué se juega.
        </p>
      </SeccionLegal>

      <SeccionLegal titulo="Datos personales">
        <p>
          Cómo tratamos tus datos está en la{' '}
          <Link href="/privacidad" className="text-primary hover:underline">
            política de privacidad
          </Link>
          .
        </p>
      </SeccionLegal>

      <SeccionLegal titulo="Ley aplicable">
        <p>
          Esta web se rige por la ley española. Si eres consumidor, puedes reclamar ante
          los tribunales de tu domicilio.
        </p>
      </SeccionLegal>
    </PaginaLegal>
  );
}
