import { cn } from '@/lib/utils';

/**
 * Lo que se ve mientras una pagina espera a la base de datos.
 *
 * No es un giro ni una barra: son bloques del tamano aproximado de lo que va a
 * llegar. Un esqueleto le dice a quien espera «esto sigue, y va a tener esta
 * forma»; un giro solo dice «espera», y encima se mueve, que es justo lo que
 * no hace falta cuando ya estas esperando.
 *
 * Lleva `role="status"` y un texto oculto: quien no ve la pantalla necesita
 * que le digan que hay algo en camino, porque unos rectangulos grises no le
 * dicen nada.
 */
export function Cargando({
  className,
  titular = true,
}: {
  className?: string;
  /** Falso cuando el titulo de la pagina ya se ha pintado y solo falta la lista. */
  titular?: boolean;
}) {
  return (
    <div role="status" aria-live="polite" className={cn(className)}>
      <span className="sr-only">Cargando…</span>

      {titular && (
        <>
          <div className="bg-secondary h-9 w-2/3 max-w-sm animate-pulse rounded-sm" />
          <div className="bg-secondary mt-3 h-4 w-1/2 max-w-xs animate-pulse rounded-sm" />
        </>
      )}

      <div className={cn('grid gap-4 sm:grid-cols-2 lg:grid-cols-3', titular && 'mt-8')}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="border-border bg-card overflow-hidden rounded-sm border"
          >
            <div className="bg-secondary aspect-[16/9] animate-pulse" />
            <div className="flex flex-col gap-2 p-4">
              <div className="bg-secondary h-4 w-3/4 animate-pulse rounded-sm" />
              <div className="bg-secondary h-3 w-1/2 animate-pulse rounded-sm" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
