'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';

import { ImagenForm } from '@/components/imagen-form';
import { Aviso, Button } from '@/components/ui';
import type { EstadoAccion } from '@/lib/acciones';

type Accion = (estado: EstadoAccion, formData: FormData) => Promise<EstadoAccion>;

function BotonQuitar() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" variante="fantasma" tamano="sm" disabled={pending}>
      {pending ? 'Quitando…' : 'Quitar foto'}
    </Button>
  );
}

/**
 * Foto de perfil: subirla y quitarla.
 *
 * La subida la hace `ImagenForm`, que es la misma pieza que usan la portada de
 * un articulo y la lamina de una partida. Antes esto era una tercera copia del
 * mismo formulario, con su propia comprobacion de tamano: tres sitios donde
 * corregir el dia que cambie el limite.
 */
export function AvatarForm({
  accionSubir,
  accionQuitar,
  tieneFoto,
}: {
  accionSubir: Accion;
  accionQuitar: Accion;
  tieneFoto: boolean;
}) {
  const [estadoBorrado, quitarAction] = useActionState<EstadoAccion, FormData>(
    accionQuitar,
    null,
  );

  return (
    <div className="flex flex-col gap-3">
      <ImagenForm
        accion={accionSubir}
        campo="avatar"
        campos={{}}
        textoBoton="Subir foto"
      />

      {estadoBorrado && 'error' in estadoBorrado && (
        <Aviso tono="error">{estadoBorrado.error}</Aviso>
      )}

      {tieneFoto && (
        <form action={quitarAction}>
          <BotonQuitar />
        </form>
      )}
    </div>
  );
}
