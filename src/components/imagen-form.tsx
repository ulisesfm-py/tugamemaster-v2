'use client';

import { useActionState, useRef, useState } from 'react';
import { useFormStatus } from 'react-dom';

import { Aviso, Button } from '@/components/ui';
import type { EstadoAccion } from '@/lib/acciones';

type Accion = (estado: EstadoAccion, formData: FormData) => Promise<EstadoAccion>;

const TAMANO_MAXIMO_BYTES = 2 * 1024 * 1024;
const TIPOS = 'image/jpeg,image/png,image/webp';

function Boton({ texto, hayArchivo }: { texto: string; hayArchivo: boolean }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" variante="perfil" disabled={pending || !hayArchivo}>
      {pending ? 'Subiendo…' : texto}
    </Button>
  );
}

/**
 * Subida de una imagen suelta.
 *
 * Es la misma pieza para la portada de un articulo y para la lamina de una
 * partida: cambian el nombre del campo y los datos ocultos que acompanan a la
 * subida, no el comportamiento. Antes esto estaba escrito dos veces y la
 * comprobacion de tamano solo existia en una.
 */
export function ImagenForm({
  accion,
  campo,
  campos,
  textoBoton,
  ayuda = 'JPG, PNG o WebP. Máximo 2 MB.',
}: {
  accion: Accion;
  /** Nombre del input de fichero: es el que lee la accion. */
  campo: string;
  /** Datos ocultos que la accion necesita para saber que esta cambiando. */
  campos: Record<string, string>;
  textoBoton: string;
  ayuda?: string;
}) {
  const [estado, formAction] = useActionState<EstadoAccion, FormData>(accion, null);
  const [errorLocal, setErrorLocal] = useState<string | null>(null);
  const [hayArchivo, setHayArchivo] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Comprobacion en el navegador: evita subir 10 MB para que el servidor los
  // rechace. El servidor valida igualmente, que es donde cuenta.
  function alElegir(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setErrorLocal(null);
    setHayArchivo(false);

    if (!file) return;

    if (file.size > TAMANO_MAXIMO_BYTES) {
      setErrorLocal('La imagen no puede pasar de 2 MB');
      if (inputRef.current) inputRef.current.value = '';
      return;
    }

    setHayArchivo(true);
  }

  return (
    <div className="flex flex-col gap-3">
      <form action={formAction} className="flex flex-wrap items-center gap-3">
        {Object.entries(campos).map(([nombre, valor]) => (
          <input key={nombre} type="hidden" name={nombre} value={valor} />
        ))}

        <input
          ref={inputRef}
          type="file"
          name={campo}
          accept={TIPOS}
          onChange={alElegir}
          aria-label={textoBoton}
          className="text-muted-foreground file:border-border file:bg-secondary file:text-foreground hover:file:bg-muted max-w-full text-sm file:mr-3 file:rounded-sm file:border file:px-3 file:py-1.5 file:text-sm file:font-medium"
        />

        <Boton texto={textoBoton} hayArchivo={hayArchivo} />
      </form>

      <p className="text-muted-foreground text-xs">{ayuda}</p>

      {errorLocal && <Aviso tono="error">{errorLocal}</Aviso>}
      {estado && 'error' in estado && <Aviso tono="error">{estado.error}</Aviso>}
      {estado && 'ok' in estado && (
        <Aviso tono="exito">{estado.mensaje ?? 'Hecho.'}</Aviso>
      )}
    </div>
  );
}
