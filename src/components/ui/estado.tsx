import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

/**
 * Etiqueta de estado.
 *
 * Una sola pieza para todos los estados de la web —partidas, reservas,
 * incidencias, pagos— para que el mismo significado tenga siempre el mismo
 * color. Si «cancelada» es roja en un sitio y gris en otro, el color deja de
 * informar y pasa a decorar.
 *
 * Los tonos son **semanticos y no comparten color con el acento**: el ascua
 * es «pulsa aqui», nunca «esto va bien».
 */
const variantes = cva(
  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap',
  {
    variants: {
      tono: {
        bien: 'bg-success/15 text-success',
        espera: 'bg-warning/15 text-warning',
        mal: 'bg-destructive/15 text-destructive',
        apagado: 'bg-secondary text-muted-foreground',
        destacado: 'bg-accent/15 text-accent',
      },
    },
    defaultVariants: { tono: 'apagado' },
  },
);

export type TonoDeEstado = NonNullable<VariantProps<typeof variantes>['tono']>;

export function Estado({
  tono,
  children,
  className,
}: VariantProps<typeof variantes> & { children: React.ReactNode; className?: string }) {
  return <span className={cn(variantes({ tono, className }))}>{children}</span>;
}

/**
 * Como se llama y de que color va cada estado del dominio.
 *
 * Vive aqui y no repartido por las paginas: hasta ahora cada pantalla
 * traducia los estados a su manera y no siempre coincidian.
 */
export const ESTADO_DE_PARTIDA = {
  DRAFT: { texto: 'Borrador', tono: 'apagado' },
  PUBLISHED: { texto: 'Publicada', tono: 'bien' },
  COMPLETED: { texto: 'Jugada', tono: 'apagado' },
  CANCELLED: { texto: 'Cancelada', tono: 'mal' },
} as const satisfies Record<string, { texto: string; tono: TonoDeEstado }>;

export const ESTADO_DE_RESERVA = {
  PENDING: { texto: 'Sin pagar', tono: 'espera' },
  PAID: { texto: 'Pagada', tono: 'bien' },
  COMPLETED: { texto: 'Jugada', tono: 'apagado' },
  CANCELLED: { texto: 'Cancelada', tono: 'apagado' },
  REFUNDED: { texto: 'Reembolsada', tono: 'destacado' },
  FAILED: { texto: 'Pago fallido', tono: 'mal' },
} as const satisfies Record<string, { texto: string; tono: TonoDeEstado }>;

export const ESTADO_DE_INCIDENCIA = {
  OPEN: { texto: 'En revisión', tono: 'espera' },
  APPROVED: { texto: 'Aprobada', tono: 'bien' },
  REJECTED: { texto: 'Desestimada', tono: 'apagado' },
} as const satisfies Record<string, { texto: string; tono: TonoDeEstado }>;

export const ESTADO_DE_PAGO = {
  PENDING: { texto: 'En camino', tono: 'espera' },
  PAID: { texto: 'Pagado', tono: 'bien' },
  BLOCKED: { texto: 'Retenido', tono: 'mal' },
  FAILED: { texto: 'Falló', tono: 'mal' },
} as const satisfies Record<string, { texto: string; tono: TonoDeEstado }>;
