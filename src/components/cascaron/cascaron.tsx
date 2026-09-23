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
      {/* Saltar al contenido: invisible hasta que se tabula. Sin el, quien
          navega con teclado recorre la cabecera entera —menu, campanita,
          saldo, cuenta— en cada pagina antes de llegar a lo que venia a leer.
          Es el primer elemento enfocable del documento a proposito. */}
      <a
        href="#contenido"
        className="bg-primary text-primary-foreground focus:ring-ring sr-only rounded-sm px-4 py-2 text-sm font-semibold focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:ring-2 focus:outline-none"
      >
        Saltar al contenido
      </a>

      <Cabecera />

      {/* `tabIndex={-1}` para que el salto pueda dejar el foco aqui: sin el,
          el navegador mueve la vista pero el foco se queda en la cabecera y
          el siguiente tabulador vuelve al principio. */}
      <div id="contenido" tabIndex={-1} className="flex-1 focus:outline-none">
        {children}
      </div>

      <PieDePagina />
    </>
  );
}
