import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

/**
 * Panel de aviso: lo que la web le dice al usuario despues de hacer algo, o
 * antes de que lo haga.
 *
 * Hasta ahora cada pantalla se escribia el suyo con sus propias clases, y
 * habia cuatro maneras distintas de decir «ha salido bien».
 *
 * `rol` no es decorativo: un acierto se anuncia con `status` y un fallo con
 * `alert`, que es lo que hace que un lector de pantalla los lea sin que el
 * usuario tenga que ir a buscarlos.
 */
const variantes = cva('flex gap-3 rounded-sm border p-3.5 text-sm', {
  variants: {
    tono: {
      exito: 'border-success/35 bg-success/10 text-success',
      error: 'border-destructive/40 bg-destructive/10 text-destructive',
      atencion: 'border-warning/35 bg-warning/10 text-warning',
      dato: 'border-border bg-card text-muted-foreground',
    },
  },
  defaultVariants: { tono: 'dato' },
});

const ICONOS = {
  exito: 'M20 6 9 17l-5-5',
  error:
    'M12 9v4m0 4h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z',
  atencion: 'M12 9v4m0 4h.01M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z',
  dato: 'M12 16v-4m0-4h.01M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z',
} as const;

export function Aviso({
  tono = 'dato',
  titulo,
  children,
  className,
}: VariantProps<typeof variantes> & {
  titulo?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  const clave = tono ?? 'dato';

  return (
    <div
      role={clave === 'error' ? 'alert' : 'status'}
      className={cn(variantes({ tono, className }))}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="mt-0.5 size-4 shrink-0"
        aria-hidden
      >
        <path d={ICONOS[clave]} />
      </svg>

      <div className="min-w-0 flex-1">
        {titulo && <p className="font-semibold">{titulo}</p>}
        {children && <div className={titulo ? 'mt-1 opacity-90' : ''}>{children}</div>}
      </div>
    </div>
  );
}
