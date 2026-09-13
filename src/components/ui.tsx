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
      className="flex items-center justify-center rounded-full bg-indigo-100 font-semibold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
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
    return (
      <span className="text-sm text-slate-500 dark:text-slate-400">Sin valoraciones</span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5">
      <span aria-hidden className="text-amber-500">
        {'★'.repeat(Math.round(valor))}
        <span className="text-slate-300 dark:text-slate-700">
          {'★'.repeat(5 - Math.round(valor))}
        </span>
      </span>
      <span className="text-sm text-slate-600 dark:text-slate-400">
        {valor.toFixed(1)}{' '}
        <span className="text-slate-500 dark:text-slate-500">
          ({total} {total === 1 ? 'reseña' : 'reseñas'})
        </span>
      </span>
    </span>
  );
}

export function Etiqueta({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
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
