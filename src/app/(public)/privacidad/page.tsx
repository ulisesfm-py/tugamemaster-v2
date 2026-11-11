import type { Metadata } from 'next';

import { Correo, PaginaLegal, SeccionLegal } from '@/components/pagina-legal';
import { TITULAR } from '@/lib/titular';

export const metadata: Metadata = {
  title: 'Privacidad · TuGameMaster',
  description:
    'Qué datos guarda TuGameMaster, para qué, con quién los comparte y cómo borrarlos.',
};

/**
 * Politica de privacidad (RGPD, art. 13).
 *
 * Tiene que describir lo que la web hace de verdad. Si se anade un proveedor
 * que trate datos personales, o una cookie que no sea tecnica, este texto se
 * actualiza en el mismo commit.
 */

const PROVEEDORES = [
  {
    nombre: 'Stripe',
    para: 'Cobrar las reservas y pagar a los game masters. Los datos de tu tarjeta los recibe Stripe directamente: nunca pasan por nuestros servidores.',
  },
  { nombre: 'Vercel', para: 'Alojar la web y las imágenes que subes.' },
  {
    nombre: 'Neon',
    para: 'Guardar la base de datos, en servidores de Frankfurt (Alemania).',
  },
  {
    nombre: 'Resend',
    para: 'Enviar los correos de la web: confirmaciones, avisos y recordatorios.',
  },
  {
    nombre: 'Sentry',
    para: 'Registrar los errores técnicos de la web. Está configurado para no recibir datos personales.',
  },
  {
    nombre: 'YouTube (Google)',
    para: 'Reproducir los vídeos de algunos artículos del blog. No se carga nada de YouTube hasta que pulsas el botón de reproducir.',
  },
  {
    nombre: 'Discord',
    para: 'Solo si eliges entrar con Discord: nos facilita tu nombre de usuario, tu avatar, tu correo y tu identificador.',
  },
] as const;

export default function PrivacidadPage() {
  return (
    <PaginaLegal
      titulo="Política de privacidad"
      entradilla="Qué datos guardamos, para qué, con quién los compartimos y cómo puedes borrarlos."
    >
      <SeccionLegal titulo="Responsable">
        <p>
          {TITULAR.nombre}, titular de {TITULAR.dominio}. Para cualquier cosa relacionada
          con tus datos: <Correo direccion={TITULAR.correo} />.
        </p>
      </SeccionLegal>

      <SeccionLegal titulo="Qué datos guardamos">
        <ul className="flex list-disc flex-col gap-2 pl-5">
          <li>
            <strong className="text-foreground">Tu cuenta</strong>: nombre, correo y
            contraseña (guardada cifrada, nunca en claro). Si entras con Discord, tu
            identificador de Discord y tu avatar.
          </li>
          <li>
            <strong className="text-foreground">Tu perfil</strong>: lo que decidas contar
            en él, como tu biografía, tu foto y tus juegos preferidos.
          </li>
          <li>
            <strong className="text-foreground">Tus reservas</strong>: a qué partidas te
            apuntas, cuánto pagas, tu saldo, las cancelaciones y las incidencias.
          </li>
          <li>
            <strong className="text-foreground">Lo que escribes</strong>: reseñas,
            comentarios en el blog y mensajes con los game masters o con nosotros.
          </li>
          <li>
            <strong className="text-foreground">Si eres game master</strong>: tus partidas
            y tus cobros. Los datos para cobrar (identidad y cuenta bancaria) se los das a
            Stripe en su propia pantalla; nosotros solo sabemos si tu cuenta está
            verificada.
          </li>
          <li>
            <strong className="text-foreground">Si te registraste con un código</strong>{' '}
            de invitación de un game master, a qué game master corresponde.
          </li>
        </ul>
      </SeccionLegal>

      <SeccionLegal titulo="Para qué y con qué base">
        <ul className="flex list-disc flex-col gap-2 pl-5">
          <li>
            <strong className="text-foreground">Prestarte el servicio</strong>: tu cuenta,
            tus reservas, los cobros y los pagos, y los correos que lo acompañan. Es la
            ejecución del contrato que aceptas al registrarte.
          </li>
          <li>
            <strong className="text-foreground">Cumplir la ley</strong>: conservar los
            registros de cobros y pagos que exige la normativa fiscal y mercantil.
          </li>
          <li>
            <strong className="text-foreground">Mantener la web segura</strong>: detectar
            errores, abusos y fraude. Es nuestro interés legítimo.
          </li>
        </ul>
        <p>
          No vendemos tus datos, no los usamos para publicidad y no te enviamos
          comunicaciones comerciales.
        </p>
      </SeccionLegal>

      <SeccionLegal titulo="Qué es público">
        <p>
          Tu perfil (nombre, foto, biografía y preferencias), las reseñas que escribes y
          tus comentarios en el blog los puede ver cualquiera. Si eres game master,
          también tus partidas y las valoraciones que recibes. Tu correo no se muestra
          nunca.
        </p>
      </SeccionLegal>

      <SeccionLegal titulo="Con quién los compartimos">
        <p>Con los proveedores que hacen funcionar la web, y solo para eso:</p>
        <ul className="flex list-disc flex-col gap-2 pl-5">
          {PROVEEDORES.map((p) => (
            <li key={p.nombre}>
              <strong className="text-foreground">{p.nombre}</strong>: {p.para}
            </li>
          ))}
        </ul>
        <p>
          Algunos son empresas de Estados Unidos. Cuando los datos salen del Espacio
          Económico Europeo, lo hacen con las garantías que exige el RGPD: el Marco de
          Privacidad de Datos UE-EE. UU. o cláusulas contractuales tipo de la Comisión
          Europea.
        </p>
        <p>
          El game master de una partida ve el nombre de quienes se apuntan a ella, pero no
          su correo.
        </p>
      </SeccionLegal>

      <SeccionLegal titulo="Cuánto tiempo">
        <p>
          Mientras tengas la cuenta. Si nos pides borrarla, eliminamos tus datos salvo los
          registros de cobros y pagos, que conservamos durante el plazo que exige la ley
          (hasta seis años) y para nada más.
        </p>
        <p>
          Para frenar a quien prueba contraseñas ajenas, contamos los intentos de entrar o
          de registrarse desde cada dirección IP y para cada correo. No guardamos ni la IP
          ni el correo, solo una huella que no se puede deshacer, y el contador se borra
          en un día.
        </p>
      </SeccionLegal>

      <SeccionLegal titulo="Tus derechos">
        <p>
          Puedes pedirnos ver tus datos, corregirlos, borrarlos, llevártelos, limitar su
          uso u oponerte a él. Escríbenos a <Correo direccion={TITULAR.correo} /> desde el
          correo de tu cuenta. Si crees que no lo hemos atendido bien, puedes reclamar
          ante la Agencia Española de Protección de Datos (aepd.es).
        </p>
      </SeccionLegal>

      <SeccionLegal titulo="Cookies">
        <p>
          Solo usamos las cookies imprescindibles para que la web funcione: la de la
          sesión, para que no tengas que entrar en cada página, y una de diez minutos que
          guarda el código de invitación mientras te registras con Discord. No hay cookies
          de analítica ni de publicidad, y por eso no te pedimos permiso al entrar.
        </p>
        <p>
          La pantalla de pago es de Stripe y usa sus propias cookies para prevenir el
          fraude. Y si pulsas el play de un vídeo de YouTube en el blog, YouTube puede
          guardar las suyas; hasta entonces no se carga nada de YouTube.
        </p>
      </SeccionLegal>

      <SeccionLegal titulo="Menores">
        <p>
          Para crear una cuenta hay que tener al menos 14 años. Para pagar una reserva hay
          que ser mayor de edad o hacerlo con permiso de tus padres o tutores.
        </p>
      </SeccionLegal>
    </PaginaLegal>
  );
}
