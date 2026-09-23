'use client';

import { useEffect } from 'react';

import { Button, EnlaceBoton } from '@/components/ui';

/**
 * Algo se ha roto de este lado.
 *
 * Tiene que ser componente de cliente: recibe `reset`, que vuelve a montar el
 * trozo que fallo sin recargar la pagina entera.
 *
 * **No se ensena el mensaje del error.** En produccion Next ya lo recorta,
 * pero ademas nunca es util: quien lo lee no puede hacer nada con «prisma
 * connection timeout», y un fallo puede arrastrar datos de otra persona. Lo
 * que se ensena es `digest`, que es la referencia con la que buscarlo en
 * Sentry si alguien nos escribe.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Sentry captura los errores no atrapados por su cuenta; esto es para que
    // quede rastro tambien cuando Sentry no esta configurado, que es el caso
    // por defecto en local.
    console.error('Fallo al renderizar la pagina:', error);
  }, [error]);

  return (
    <main className="mx-auto flex max-w-lg flex-col items-center px-4 py-20 text-center">
      <h1 className="font-heading text-foreground text-3xl font-extrabold text-balance">
        Algo se ha roto por aquí
      </h1>

      <p className="text-muted-foreground mt-3">
        No es culpa tuya. Si estabas reservando una plaza, comprueba en{' '}
        <a href="/mis-reservas" className="text-primary hover:underline">
          Mis reservas
        </a>{' '}
        antes de volver a intentarlo: puede que ya esté hecha.
      </p>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button onClick={reset}>Volver a intentarlo</Button>
        <EnlaceBoton href="/" variante="perfil">
          Ir a la portada
        </EnlaceBoton>
      </div>

      {error.digest && (
        <p className="text-muted-foreground/70 mt-8 text-xs">
          Si nos escribes, dinos esta referencia:{' '}
          <code className="text-muted-foreground">{error.digest}</code>
        </p>
      )}
    </main>
  );
}
