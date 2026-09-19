import Image from 'next/image';

/**
 * Piezas visuales compartidas. Todas son componentes de servidor: no llevan
 * estado ni interaccion.
 */

/** Avatar con inicial de respaldo cuando el usuario no tiene imagen. */
export function Avatar({
  src,
  nombre,
  tamano = 48,
}: {
  src: string | null;
  nombre: string;
  tamano?: number;
}) {
  if (src) {
    return (
      <Image
        src={src}
        alt=""
        width={tamano}
        height={tamano}
        className="rounded-full object-cover"
      />
    );
  }

  return (
    <div
      aria-hidden
      style={{ width: tamano, height: tamano, fontSize: tamano * 0.4 }}
      className="bg-accent/20 font-heading text-accent flex items-center justify-center rounded-full font-bold"
    >
      {nombre.charAt(0).toUpperCase()}
    </div>
  );
}

/**
 * Valoracion en estrellas.
 *
 * El texto accesible lleva el numero: las estrellas son decorativas y un
 * lector de pantalla no debe leer cinco simbolos sueltos.
 */
export function Estrellas({ valor, total }: { valor: number | null; total: number }) {
  if (valor === null) {
    return <span className="text-muted-foreground text-sm">Sin valoraciones</span>;
  }

  return (
    <span className="inline-flex items-center gap-1.5">
      <span aria-hidden className="text-accent">
        {'★'.repeat(Math.round(valor))}
        <span className="text-border">{'★'.repeat(5 - Math.round(valor))}</span>
      </span>
      <span className="text-foreground text-sm">
        {valor.toFixed(1)}{' '}
        <span className="text-muted-foreground">
          ({total} {total === 1 ? 'reseña' : 'reseñas'})
        </span>
      </span>
    </span>
  );
}

export function Etiqueta({ children }: { children: React.ReactNode }) {
  return (
    <span className="bg-secondary text-muted-foreground rounded-full px-2.5 py-1 text-xs font-medium">
      {children}
    </span>
  );
}

/** Importe en centimos, formateado como moneda. */
export function Precio({ cents, currency }: { cents: number; currency: string }) {
  return (
    <>
      {new Intl.NumberFormat('es-ES', { style: 'currency', currency }).format(
        cents / 100,
      )}
    </>
  );
}

/** Fecha larga en espanol. */
export function Fecha({ valor }: { valor: Date }) {
  return (
    <time dateTime={valor.toISOString()}>
      {new Intl.DateTimeFormat('es-ES', {
        dateStyle: 'long',
        timeStyle: 'short',
      }).format(valor)}
    </time>
  );
}
