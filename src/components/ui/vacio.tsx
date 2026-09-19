import { cn } from '@/lib/utils';

/**
 * Estado vacio.
 *
 * Un hueco sin contenido no es un error, es una ocasion: casi siempre hay algo
 * que la persona puede hacer para llenarlo. Por eso admite una accion y no se
 * queda en «no hay nada».
 *
 * Hasta ahora cada pantalla resolvia esto a su manera; varias ni lo resolvian.
 */
export function Vacio({
  titulo,
  children,
  accion,
  className,
}: {
  titulo: string;
  children?: React.ReactNode;
  accion?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'border-border flex flex-col items-center gap-3 rounded-sm border border-dashed px-6 py-12 text-center',
        className,
      )}
    >
      <p className="font-heading text-foreground text-base font-bold">{titulo}</p>
      {children && <p className="text-muted-foreground max-w-sm text-sm">{children}</p>}
      {accion}
    </div>
  );
}
