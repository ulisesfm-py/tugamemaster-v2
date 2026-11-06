'use client';

import { useState } from 'react';

import { Button } from '@/components/ui';

/**
 * Copia un texto al portapapeles y lo dice.
 *
 * Si el navegador no deja escribir en el portapapeles —pasa sin HTTPS, o con
 * permisos restringidos—, avisa en vez de fingir que lo ha copiado: el texto
 * sigue a la vista para copiarlo a mano.
 */
export function CopiarBoton({ texto, etiqueta }: { texto: string; etiqueta: string }) {
  const [estado, setEstado] = useState<'listo' | 'copiado' | 'fallo'>('listo');

  async function copiar() {
    try {
      await navigator.clipboard.writeText(texto);
      setEstado('copiado');
    } catch {
      setEstado('fallo');
    }
    setTimeout(() => setEstado('listo'), 2500);
  }

  return (
    <Button type="button" variante="perfil" tamano="sm" onClick={copiar}>
      {estado === 'copiado'
        ? 'Copiado'
        : estado === 'fallo'
          ? 'No se pudo copiar: cópialo a mano'
          : etiqueta}
    </Button>
  );
}
