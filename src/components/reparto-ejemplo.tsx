import { cn } from '@/lib/utils';
import {
  calcularReparto,
  COMISION_PUNTOS_BASICOS,
  formatearImporte,
} from '@/modules/payments/dinero';

/**
 * El reparto de una mesa, con numeros de verdad.
 *
 * Lo calcula `calcularReparto`, que es la misma funcion que reparte el dinero
 * al cobrar. Antes estos importes estaban escritos a mano en la portada: si
 * algun dia cambia la comision, un ejemplo escrito a mano se queda mintiendo
 * justo en la pagina que usamos para captar game masters.
 *
 * El coste de la pasarela si es una estimacion —el real lo dice Stripe en cada
 * cobro— y por eso se dice que lo es.
 */
export function RepartoEjemplo({
  plazas = 5,
  precioCents = 1500,
  pasarelaCents = 285,
  className,
}: {
  plazas?: number;
  precioCents?: number;
  /** Lo que cobraria la pasarela por una mesa asi, aproximado. */
  pasarelaCents?: number;
  className?: string;
}) {
  const bruto = precioCents * plazas;
  const reparto = calcularReparto(bruto, pasarelaCents);
  const comision = COMISION_PUNTOS_BASICOS / 100;

  return (
    <div className={cn('border-border bg-card rounded-sm border p-6', className)}>
      <p className="text-muted-foreground text-xs font-semibold tracking-widest uppercase">
        Un ejemplo
      </p>
      <p className="text-muted-foreground mt-3 text-sm">
        Una mesa de {plazas} plazas a {formatearImporte(precioCents)} cada una:
      </p>

      <dl className="mt-4 flex flex-col gap-2 text-sm">
        {[
          ['Cobras', formatearImporte(reparto.amountCents)],
          [`Comisión (${comision}%)`, `− ${formatearImporte(reparto.commissionCents)}`],
          ['Coste de la pasarela', `− ${formatearImporte(reparto.stripeFeeCents)}`],
        ].map(([clave, valor]) => (
          <div key={clave} className="flex justify-between gap-4">
            <dt className="text-muted-foreground">{clave}</dt>
            <dd className="text-foreground tabular-nums">{valor}</dd>
          </div>
        ))}

        <div className="border-border mt-1 flex justify-between gap-4 border-t pt-3">
          <dt className="text-foreground font-semibold">Te llevas</dt>
          <dd className="font-heading text-primary text-lg font-bold tabular-nums">
            {formatearImporte(reparto.payoutCents)}
          </dd>
        </div>
      </dl>

      <p className="text-muted-foreground mt-3 text-xs">
        El coste de la pasarela es aproximado: en cada cobro se descuenta el real que nos
        cobra Stripe, no una estimación.
      </p>
    </div>
  );
}
