'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';

import { Aviso, Button, Campo, CLASE_CONTROL } from '@/components/ui';
import type { EstadoAccion } from '@/lib/acciones';

type Accion = (estado: EstadoAccion, formData: FormData) => Promise<EstadoAccion>;

function Guardar() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Guardando…' : 'Guardar cambios'}
    </Button>
  );
}

function Resultado({ estado }: { estado: EstadoAccion }) {
  if (!estado) return null;

  if ('error' in estado) return <Aviso tono="error">{estado.error}</Aviso>;

  return <Aviso tono="exito">Guardado.</Aviso>;
}

export function PerfilJugadorForm({
  accion,
  valores,
}: {
  accion: Accion;
  valores: {
    name: string;
    bio: string | null;
    preferredSystems: string[];
    preferredStyles: string[];
  };
}) {
  const [estado, formAction] = useActionState<EstadoAccion, FormData>(accion, null);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <Campo id="name" etiqueta="Nombre">
        <input
          id="name"
          name="name"
          defaultValue={valores.name}
          required
          className={CLASE_CONTROL}
        />
      </Campo>

      <Campo
        id="bio"
        etiqueta="Sobre ti"
        opcional
        ayuda="Lo que quieras contarle a la gente con la que vas a jugar. Máximo 500 caracteres."
      >
        <textarea
          id="bio"
          name="bio"
          rows={4}
          defaultValue={valores.bio ?? ''}
          className={CLASE_CONTROL}
        />
      </Campo>

      <Campo
        id="preferredSystems"
        etiqueta="Sistemas que te gustan"
        opcional
        ayuda="Separados por comas. Por ejemplo: D&D 5e, Vaesen, Call of Cthulhu"
      >
        <input
          id="preferredSystems"
          name="preferredSystems"
          defaultValue={valores.preferredSystems.join(', ')}
          className={CLASE_CONTROL}
        />
      </Campo>

      <Campo
        id="preferredStyles"
        etiqueta="Estilo de juego que prefieres"
        opcional
        ayuda="Separados por comas. Por ejemplo: narrativo, combate, investigación"
      >
        <input
          id="preferredStyles"
          name="preferredStyles"
          defaultValue={valores.preferredStyles.join(', ')}
          className={CLASE_CONTROL}
        />
      </Campo>

      <Resultado estado={estado} />

      <div>
        <Guardar />
      </div>
    </form>
  );
}

export function PerfilGmForm({
  accion,
  valores,
}: {
  accion: Accion;
  valores: {
    headline: string;
    about: string | null;
    languages: string[];
    yearsExperience: number | null;
    systems: string[];
  } | null;
}) {
  const [estado, formAction] = useActionState<EstadoAccion, FormData>(accion, null);

  return (
    <form action={formAction} className="flex flex-col gap-8">
      <fieldset className="flex flex-col gap-4">
        <legend className="font-heading text-foreground mb-3 text-lg font-bold">
          Cómo te presentas
        </legend>

        <Campo
          id="headline"
          etiqueta="Titular"
          ayuda="Una línea que resuma qué tipo de mesas diriges."
        >
          <input
            id="headline"
            name="headline"
            defaultValue={valores?.headline ?? ''}
            required
            minLength={10}
            maxLength={120}
            className={CLASE_CONTROL}
            placeholder="Terror investigativo en los años 20"
          />
        </Campo>

        <Campo
          id="about"
          etiqueta="Cómo diriges"
          opcional
          ayuda="Lo que un jugador querría saber antes de reservar. Máximo 2000 caracteres."
        >
          <textarea
            id="about"
            name="about"
            rows={6}
            defaultValue={valores?.about ?? ''}
            className={CLASE_CONTROL}
          />
        </Campo>

        <Campo
          id="languages"
          etiqueta="Idiomas"
          ayuda="Códigos de dos letras separados por comas: es, en, fr"
        >
          <input
            id="languages"
            name="languages"
            defaultValue={valores?.languages.join(', ') ?? 'es'}
            required
            className={CLASE_CONTROL}
          />
        </Campo>
      </fieldset>

      {/* De aqui para abajo, lo que cuenta el GM de si mismo. Su perfil lo
          ensena separado de las estrellas y las partidas dirigidas, que salen
          de reservas pagadas; decirselo aqui explica por que se le piden
          aparte y por que no pasa nada por dejarlo en blanco. */}
      <fieldset className="flex flex-col gap-4">
        <legend className="font-heading text-foreground text-lg font-bold">
          Lo que cuentas tú
        </legend>
        <p className="text-muted-foreground -mt-2 text-sm">
          Esto no lo comprobamos, y en tu perfil aparece separado de lo que sí
          certificamos: tus estrellas y las partidas que has dirigido aquí.
        </p>

        <Campo id="yearsExperience" etiqueta="Años dirigiendo" opcional>
          <input
            id="yearsExperience"
            name="yearsExperience"
            type="number"
            min="0"
            max="60"
            step="1"
            defaultValue={valores?.yearsExperience ?? ''}
            className={`${CLASE_CONTROL} sm:w-32`}
          />
        </Campo>

        <Campo
          id="systems"
          etiqueta="Sistemas que dominas"
          opcional
          ayuda="Separados por comas: D&D 5e, Vaesen, Vampiro"
        >
          <input
            id="systems"
            name="systems"
            defaultValue={valores?.systems.join(', ') ?? ''}
            className={CLASE_CONTROL}
          />
        </Campo>
      </fieldset>

      <Resultado estado={estado} />

      <div>
        <Guardar />
      </div>
    </form>
  );
}
