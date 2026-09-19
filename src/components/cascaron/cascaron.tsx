import { Cabecera } from './cabecera';
import { PieDePagina } from './pie';

/**
 * El armazon compartido: cabecera, contenido y pie.
 *
 * Lo usan los tres grupos de rutas que tienen navegacion. Las paginas de
 * entrar y registrarse no: alli el unico trabajo es el formulario, y una
 * cabecera con menu solo invita a irse.
 */
export function Cascaron({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Cabecera />
      <div className="flex-1">{children}</div>
      <PieDePagina />
    </>
  );
}
