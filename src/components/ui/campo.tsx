import { cn } from '@/lib/utils';

/**
 * Piezas de formulario.
 *
 * `CLASE_CONTROL` se exporta como cadena a proposito: los formularios de la
 * web usan `input`, `textarea` y `select` nativos, y envolver cada uno en su
 * componente solo anadiria capas sin ganar nada.
 */

export const CLASE_CONTROL =
  'w-full rounded-sm border border-input bg-card px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/70 focus:border-ring focus:ring-2 focus:ring-ring/30 focus:outline-none disabled:opacity-60';

/**
 * Etiqueta, control, ayuda y error, siempre en el mismo orden.
 *
 * El error se anuncia con `role="alert"` y se enlaza al control con
 * `aria-describedby`, que es lo que hace que quien navega a ciegas se entere
 * de por que no le dejan enviar.
 */
export function Campo({
  id,
  etiqueta,
  ayuda,
  error,
  opcional,
  children,
  className,
}: {
  id: string;
  etiqueta: string;
  ayuda?: string;
  error?: string;
  opcional?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={id} className="text-foreground text-sm font-medium">
        {etiqueta}
        {opcional && (
          <span className="text-muted-foreground ml-1.5 font-normal">(opcional)</span>
        )}
      </label>

      {children}

      {ayuda && !error && (
        <p id={`${id}-ayuda`} className="text-muted-foreground text-xs">
          {ayuda}
        </p>
      )}

      {error && (
        <p
          id={`${id}-error`}
          role="alert"
          className="text-destructive text-xs font-medium"
        >
          {error}
        </p>
      )}
    </div>
  );
}
