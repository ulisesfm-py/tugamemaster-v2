import { EnlaceBoton } from '@/components/ui';

/**
 * El contenido de un 404, sin armazon.
 *
 * Va suelto porque se pinta en dos sitios que traen layouts distintos: dentro
 * de un grupo de rutas —que ya monta cabecera y pie— y en la raiz, para una
 * direccion que no encaja con ninguna ruta y por tanto no tiene layout con
 * armazon. Si esto lo incluyera, el primer caso saldria con dos cabeceras.
 */
export function NoEncontrado() {
  return (
    <main className="mx-auto flex max-w-lg flex-col items-center px-4 py-20 text-center">
      <p className="font-heading text-primary text-5xl font-extrabold">404</p>

      <h1 className="font-heading text-foreground mt-4 text-3xl font-extrabold text-balance">
        Aquí no hay nada
      </h1>

      <p className="text-muted-foreground mt-3">
        Puede que la partida se cancelara, que el artículo se retirara, o que la dirección
        tenga una letra de más.
      </p>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <EnlaceBoton href="/partidas">Ver mesas abiertas</EnlaceBoton>
        <EnlaceBoton href="/" variante="perfil">
          Ir a la portada
        </EnlaceBoton>
      </div>
    </main>
  );
}
