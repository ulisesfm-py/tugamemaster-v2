import Link from 'next/link';

import { formatearImporte } from '@/modules/payments/dinero';

/**
 * El saldo, en la cabecera.
 *
 * Solo aparece cuando hay saldo. Un «0,00 €» permanente al lado de la
 * campanita no le dice nada a nadie y compite con lo que si importa; en
 * cambio, quien tiene dinero devuelto necesita verlo sin buscarlo, porque es
 * lo que hace que vuelva a reservar. Con saldo a cero se sigue llegando desde
 * el panel, que es donde toca mirarlo a proposito.
 */
export function Saldo({ cents }: { cents: number }) {
  if (cents <= 0) return null;

  return (
    <Link
      href="/cuenta/saldo"
      className="border-border text-foreground hover:border-primary hover:text-primary focus-visible:ring-ring focus-visible:ring-offset-background flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-sm font-semibold tabular-nums transition focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
    >
      <span className="sr-only">Mi saldo:</span>
      <span aria-hidden className="text-accent">
        ●
      </span>
      {formatearImporte(cents)}
    </Link>
  );
}
