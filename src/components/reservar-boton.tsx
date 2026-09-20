'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';

import { Aviso, Button } from '@/components/ui';
import type { EstadoAccion } from '@/lib/acciones';

type Accion = (estado: EstadoAccion, formData: FormData) => Promise<EstadoAccion>;

function Boton({ texto, destructivo }: { texto: string; destructivo?: boolean }) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      variante={destructivo ? 'peligro' : 'solido'}
      tamano="lg"
      disabled={pending}
      className="w-full"
    >
      {pending ? 'Un momento…' : texto}
    </Button>
  );
}

/**
 * Boton de reservar o de liberar plaza. Ambos comparten el manejo de estado,
 * que es lo unico que necesita ser cliente en toda la pagina de detalle.
 */
export function ReservarBoton({
  accion,
  texto,
  campos,
  destructivo,
}: {
  accion: Accion;
  texto: string;
  campos: Record<string, string>;
  destructivo?: boolean;
}) {
  const [estado, formAction] = useActionState<EstadoAccion, FormData>(accion, null);

  return (
    <div>
      <form action={formAction}>
        {Object.entries(campos).map(([nombre, valor]) => (
          <input key={nombre} type="hidden" name={nombre} value={valor} />
        ))}
        <Boton texto={texto} destructivo={destructivo} />
      </form>

      {estado && 'error' in estado && (
        <Aviso tono="error" className="mt-3">
          {estado.error}
        </Aviso>
      )}

      {estado && 'ok' in estado && (
        <Aviso tono="exito" className="mt-3">
          {estado.mensaje ?? 'Hecho.'}
        </Aviso>
      )}
    </div>
  );
}
