import Image from 'next/image';

/**
 * Piezas visuales compartidas. Todas son componentes de servidor: no llevan
 * estado ni interaccion.
 */

/**
 * Avatar con inicial de respaldo cuando el usuario no tiene imagen.
 *
 * `fundador` lo rodea de laton y le pone una insignia en la esquina. Es solo
 * la marca visual: el avatar es decorativo para un lector de pantalla, asi que
 * quien lo use tiene que poner tambien `<Fundador />` junto al nombre.
 */
export function Avatar({
  src,
  nombre,
  tamano = 48,
  fundador = false,
}: {
  src: string | null;
  nombre: string;
  tamano?: number;
  fundador?: boolean;
}) {
  const cara = src ? (
    <Image
      src={src}
      alt=""
      width={tamano}
      height={tamano}
      // El tamano va tambien en el estilo: dentro de una fila flex sin
      // `items-start`, una imagen sin alto fijado se estira con la fila.
      style={{ width: tamano, height: tamano }}
      className="shrink-0 rounded-full object-cover"
    />
  ) : (
    <div
      aria-hidden
      style={{ width: tamano, height: tamano, fontSize: tamano * 0.4 }}
      className="bg-accent/20 font-heading text-accent flex items-center justify-center rounded-full font-bold"
    >
      {nombre.charAt(0).toUpperCase()}
    </div>
  );

  if (!fundador) return cara;

  // La insignia nunca baja de 12 px: en el avatar de 22 px de una tabla seria
  // un punto que no se reconoce.
  const insignia = Math.max(12, Math.round(tamano * 0.36));

  return (
    <span
      className="ring-accent ring-offset-background relative inline-flex shrink-0 rounded-full ring-2 ring-offset-2"
      style={{ width: tamano, height: tamano }}
    >
      {cara}
      <span
        aria-hidden
        className="bg-accent text-accent-foreground ring-background absolute -right-1 -bottom-1 flex items-center justify-center rounded-full ring-2"
        style={{ width: insignia, height: insignia }}
      >
        <EmblemaFundador tamano={insignia * 0.62} />
      </span>
    </span>
  );
}

/** Una estrella de cuatro puntas: la chispa del ascua. */
function EmblemaFundador({ tamano }: { tamano: number }) {
  return (
    <svg
      width={tamano}
      height={tamano}
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden
    >
      <path d="M8 0c.6 4.2 3.8 7.4 8 8-4.2.6-7.4 3.8-8 8-.6-4.2-3.8-7.4-8-8 4.2-.6 7.4-3.8 8-8Z" />
    </svg>
  );
}

/**
 * La etiqueta de game master fundador, para poner junto a su nombre.
 *
 * Lleva texto y no solo el emblema: es lo que lee un lector de pantalla, y lo
 * que explica el anillo del avatar a quien no sabe que significa.
 */
export function Fundador({ className = '' }: { className?: string }) {
  return (
    <span
      title="Uno de los primeros game masters de TuGameMaster"
      className={`border-accent/40 bg-accent/10 text-accent inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold ${className}`}
    >
      <EmblemaFundador tamano={10} />
      Fundador
    </span>
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
