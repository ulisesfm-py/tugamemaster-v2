'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Comportamiento de un panel desplegable de la cabecera.
 *
 * El nombre empieza por `use` y no por `usar` a pesar del resto del codigo:
 * no es una preferencia de estilo, es lo que React exige para reconocer un
 * hook —y lo que hace que las reglas que comprueban su uso funcionen.
 *
 * Cerrar al pulsar fuera y cerrar con Escape es lo que espera cualquiera de un
 * menu, y es justo lo que un `<details>` no da gratis. Vive en un hook y no
 * copiado en cada componente porque la campanita y el menu de usuario tienen
 * markup distinto pero exactamente el mismo comportamiento: si se separaran,
 * uno de los dos acabaria sin Escape.
 */
export function useDesplegable() {
  const [abierta, setAbierta] = useState(false);
  const caja = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!abierta) return;

    function fuera(e: MouseEvent) {
      if (!caja.current?.contains(e.target as Node)) setAbierta(false);
    }

    function escape(e: KeyboardEvent) {
      if (e.key === 'Escape') setAbierta(false);
    }

    document.addEventListener('mousedown', fuera);
    document.addEventListener('keydown', escape);

    return () => {
      document.removeEventListener('mousedown', fuera);
      document.removeEventListener('keydown', escape);
    };
  }, [abierta]);

  return { abierta, setAbierta, caja };
}

/** Clases del panel que cuelga del boton. Las comparten los dos desplegables. */
export const CLASE_PANEL =
  'border-border bg-popover absolute right-0 z-50 mt-2 overflow-hidden rounded-sm border shadow-xl shadow-black/40';
