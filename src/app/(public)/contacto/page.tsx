import type { Metadata } from 'next';
import Link from 'next/link';

import { Correo, PaginaLegal, SeccionLegal } from '@/components/pagina-legal';
import { TITULAR } from '@/lib/titular';

export const metadata: Metadata = {
  title: 'Contacto · TuGameMaster',
  description: 'Cómo escribir a TuGameMaster.',
};

export default function ContactoPage() {
  return (
    <PaginaLegal
      titulo="Contacto"
      entradilla="Somos un equipo pequeño y leemos todo lo que llega."
      conFecha={false}
    >
      <SeccionLegal titulo="Escríbenos">
        <p className="text-lg">
          <Correo direccion={TITULAR.correo} />
        </p>
        <p>
          Si es sobre una reserva, escríbenos desde el correo de tu cuenta y dinos qué
          partida es: así te contestamos sin tener que preguntarte nada más.
        </p>
      </SeccionLegal>

      <SeccionLegal titulo="Si algo ha ido mal en una partida">
        <p>
          Lo más rápido es abrir una incidencia desde{' '}
          <Link href="/mis-reservas" className="text-primary hover:underline">
            Mis reservas
          </Link>
          . Mientras la revisamos, el pago al game master queda detenido. Tienes los
          detalles en las{' '}
          <Link href="/condiciones" className="text-primary hover:underline">
            condiciones de reserva
          </Link>
          .
        </p>
      </SeccionLegal>
    </PaginaLegal>
  );
}
