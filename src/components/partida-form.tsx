'use client';

import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';

import { Aviso, Button, Campo, CLASE_CONTROL } from '@/components/ui';
import { loEscrito, type EstadoAccion } from '@/lib/acciones';
import {
  ETIQUETAS,
  EXPERIENCIA,
  EXPERIENCIAS,
  GRUPOS,
  IDIOMAS,
  MAXIMO_ETIQUETAS,
  type Experiencia,
  type Grupo,
} from '@/modules/games/ficha';
import { RESUMEN_MAXIMO } from '@/modules/campaigns/politica';
import { CONTRASENA_MAXIMA, CONTRASENA_MINIMA } from '@/modules/games/schema';

type Accion = (estado: EstadoAccion, formData: FormData) => Promise<EstadoAccion>;

function Guardar({ texto }: { texto: string }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" tamano="lg" disabled={pending}>
      {pending ? 'Guardando…' : texto}
    </Button>
  );
}

/**
 * Casilla con aspecto de pastilla.
 *
 * Son casillas de verdad —no botones que fingen serlo— para que el formulario
 * funcione sin JavaScript y para que el teclado y los lectores de pantalla las
 * entiendan solos. Lo unico que hace el `peer` es pintar la marcada.
 */
function Pastilla({
  name,
  value,
  texto,
  defecto,
}: {
  name: string;
  value: string;
  texto: string;
  defecto: boolean;
}) {
  return (
    <label className="cursor-pointer">
      <input
        type="checkbox"
        name={name}
        value={value}
        defaultChecked={defecto}
        className="peer sr-only"
      />
      <span className="border-border text-muted-foreground hover:border-muted-foreground peer-checked:border-primary peer-checked:bg-primary/12 peer-checked:text-primary peer-focus-visible:ring-ring peer-focus-visible:ring-offset-background inline-block rounded-full border px-3 py-1.5 text-sm transition peer-focus-visible:ring-2 peer-focus-visible:ring-offset-2">
        {texto}
      </span>
    </label>
  );
}

/** Fecha en el formato que espera datetime-local, en hora local. */
function paraInput(fecha: Date): string {
  const desfase = fecha.getTimezoneOffset() * 60_000;
  return new Date(fecha.getTime() - desfase).toISOString().slice(0, 16);
}

export type ValoresDePartida = {
  id: string;
  title: string;
  description: string;
  system: string;
  startsAt: Date;
  endsAt: Date;
  seatsTotal: number;
  priceCents: number;
  languages: string[];
  experience: Experiencia;
  minAge: number | null;
  tags: string[];
  visibility: 'PUBLICA' | 'PRIVADA';
  accessPassword: string | null;
};

export function PartidaForm({
  accion,
  textoBoton,
  valores,
  idiomasPorDefecto = [],
  campana,
}: {
  accion: Accion;
  textoBoton: string;
  valores?: ValoresDePartida;
  /**
   * Idiomas del game master, para una partida nueva. No se heredan al editar:
   * ahi mandan los de la mesa, que es justo el dato que se quiso separar.
   */
  idiomasPorDefecto?: string[];
  /**
   * Campo de campana, solo al continuar una partida.
   *
   * Vive aqui y no lo pinta la pagina porque tiene que recuperar lo escrito
   * igual que los demas, y eso solo puede hacerlo quien conoce el estado de la
   * accion.
   */
  campana?: { ayuda: string; resumen: string };
}) {
  const [estado, formAction] = useActionState<EstadoAccion, FormData>(accion, null);

  // React vacia un formulario no controlado en cuanto termina su accion, asi
  // que cada campo toma su valor por defecto de lo que se acababa de enviar:
  // cuando React vacie, vaciara a lo que la persona habia escrito.
  const { texto, marcadas } = loEscrito(estado);

  const duracion = valores
    ? Math.round((valores.endsAt.getTime() - valores.startsAt.getTime()) / 3_600_000)
    : 4;

  const idiomas = marcadas(
    'languages',
    valores
      ? valores.languages
      : idiomasPorDefecto.length > 0
        ? idiomasPorDefecto
        : ['es'],
  );

  const enviada = texto('experience');
  const experiencia: Experiencia =
    enviada in EXPERIENCIA
      ? (enviada as Experiencia)
      : (valores?.experience ?? 'ABIERTA');

  const etiquetas = marcadas('tags', valores?.tags ?? []);

  // En estado para ensenar el campo de la contrasena solo cuando hace falta.
  // Arranca de lo enviado si fallo la validacion, o de la ficha si se edita.
  const [privada, setPrivada] = useState(
    texto('visibility', valores?.visibility ?? 'PUBLICA') === 'PRIVADA',
  );

  return (
    <form action={formAction} className="flex flex-col gap-8">
      {valores && <input type="hidden" name="gameId" value={valores.id} />}

      <fieldset className="flex flex-col gap-4">
        <legend className="font-heading text-foreground mb-3 text-lg font-bold">
          La partida
        </legend>

        <Campo id="title" etiqueta="Título">
          <input
            id="title"
            name="title"
            defaultValue={texto('title', valores?.title ?? '')}
            required
            className={CLASE_CONTROL}
            placeholder="El faro de Finisterre"
          />
        </Campo>

        <Campo id="system" etiqueta="Sistema de juego">
          <input
            id="system"
            name="system"
            defaultValue={texto('system', valores?.system ?? '')}
            required
            className={CLASE_CONTROL}
            placeholder="D&D 5e"
          />
        </Campo>

        <Campo
          id="description"
          etiqueta="Descripción"
          ayuda="Qué van a jugar, qué tono tiene la mesa y qué hace falta saber antes de apuntarse."
        >
          <textarea
            id="description"
            name="description"
            rows={7}
            defaultValue={texto('description', valores?.description ?? '')}
            required
            className={CLASE_CONTROL}
          />
        </Campo>
      </fieldset>

      <fieldset className="flex flex-col gap-4">
        <legend className="font-heading text-foreground text-lg font-bold">
          Para quién es
        </legend>
        <p className="text-muted-foreground -mt-2 text-sm">
          Es lo que decide si alguien se apunta. Nadie reserva una mesa si no sabe si va a
          encajar en ella.
        </p>

        <Campo
          id="experience"
          etiqueta="Experiencia que se presupone"
          ayuda={EXPERIENCIA[experiencia].explicacion}
        >
          {/* El `key` no es decoracion. React actualiza el valor por defecto de
              un `input` al repintarlo, pero en un `select` no mueve el
              `selected` de la opcion: al recuperar lo enviado, el desplegable
              se quedaba en la primera opcion mientras la ayuda de debajo
              explicaba otra. Cambiar la clave lo monta de nuevo, y entonces si
              toma la opcion que la persona habia elegido. */}
          <select
            key={experiencia}
            id="experience"
            name="experience"
            defaultValue={experiencia}
            className={CLASE_CONTROL}
          >
            {EXPERIENCIAS.map((nivel) => (
              <option key={nivel} value={nivel}>
                {EXPERIENCIA[nivel].titulo}
              </option>
            ))}
          </select>
        </Campo>

        <div className="flex flex-col gap-2">
          <span className="text-foreground text-sm font-medium">Idioma de la mesa</span>
          <div className="flex flex-wrap gap-2">
            {IDIOMAS.map((i) => (
              <Pastilla
                key={i.codigo}
                name="languages"
                value={i.codigo}
                texto={i.texto}
                defecto={idiomas.includes(i.codigo)}
              />
            ))}
          </div>
          <p className="text-muted-foreground text-xs">
            El de esta partida, no el de todas las tuyas.
          </p>
        </div>

        <Campo
          id="minAge"
          etiqueta="Edad mínima"
          opcional
          ayuda="Déjalo vacío si no hay ninguna."
        >
          <input
            id="minAge"
            name="minAge"
            type="number"
            min="6"
            max="99"
            step="1"
            defaultValue={texto(
              'minAge',
              valores?.minAge == null ? '' : String(valores.minAge),
            )}
            className={`${CLASE_CONTROL} w-32`}
            placeholder="16"
          />
        </Campo>

        {(Object.keys(GRUPOS) as Grupo[]).map((grupo) => (
          <div key={grupo} className="flex flex-col gap-2">
            <span className="text-foreground text-sm font-medium">{GRUPOS[grupo]}</span>
            <div className="flex flex-wrap gap-2">
              {ETIQUETAS.filter((e) => e.grupo === grupo).map((e) => (
                <Pastilla
                  key={e.id}
                  name="tags"
                  value={e.id}
                  texto={e.texto}
                  defecto={etiquetas.includes(e.id)}
                />
              ))}
            </div>
          </div>
        ))}

        <p className="text-muted-foreground text-xs">
          Hasta {MAXIMO_ETIQUETAS} etiquetas entre las dos listas. Una mesa etiquetada con
          todo no dice nada.
        </p>
      </fieldset>

      <fieldset className="flex flex-col gap-4">
        <legend className="font-heading text-foreground mb-3 text-lg font-bold">
          Cuándo y cuánto
        </legend>

        <div className="grid gap-4 sm:grid-cols-2">
          <Campo id="startsAt" etiqueta="Empieza">
            <input
              id="startsAt"
              name="startsAt"
              type="datetime-local"
              defaultValue={texto('startsAt', valores ? paraInput(valores.startsAt) : '')}
              required
              className={CLASE_CONTROL}
            />
          </Campo>

          <Campo id="durationHours" etiqueta="Duración (horas)">
            <input
              id="durationHours"
              name="durationHours"
              type="number"
              min="1"
              max="12"
              step="1"
              defaultValue={texto('durationHours', String(duracion))}
              required
              className={CLASE_CONTROL}
            />
          </Campo>

          <Campo id="seatsTotal" etiqueta="Plazas">
            <input
              id="seatsTotal"
              name="seatsTotal"
              type="number"
              min="1"
              max="12"
              step="1"
              defaultValue={texto('seatsTotal', String(valores?.seatsTotal ?? 4))}
              required
              className={CLASE_CONTROL}
            />
          </Campo>

          <Campo id="price" etiqueta="Precio por plaza (€)">
            <input
              id="price"
              name="price"
              inputMode="decimal"
              defaultValue={texto(
                'price',
                valores ? (valores.priceCents / 100).toFixed(2) : '',
              )}
              required
              className={CLASE_CONTROL}
              placeholder="15"
            />
          </Campo>
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-4">
        <legend className="font-heading text-foreground mb-3 text-lg font-bold">
          Quién puede reservar
        </legend>

        <div className="grid gap-3 sm:grid-cols-2">
          {(
            [
              {
                valor: 'PUBLICA',
                titulo: 'Pública',
                texto: 'Cualquiera con cuenta puede reservar.',
              },
              {
                valor: 'PRIVADA',
                titulo: 'Privada',
                texto:
                  'Sale en el listado, pero para reservar hay que saber la contraseña que tú repartes.',
              },
            ] as const
          ).map((opcion) => (
            <label key={opcion.valor} className="cursor-pointer">
              <input
                type="radio"
                name="visibility"
                value={opcion.valor}
                checked={privada === (opcion.valor === 'PRIVADA')}
                onChange={() => setPrivada(opcion.valor === 'PRIVADA')}
                className="peer sr-only"
              />
              <span className="border-border hover:border-muted-foreground peer-checked:border-primary peer-checked:bg-primary/8 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-background block h-full rounded-sm border p-4 transition peer-focus-visible:ring-2 peer-focus-visible:ring-offset-2">
                <span className="text-foreground block font-semibold">
                  {opcion.titulo}
                </span>
                <span className="text-muted-foreground mt-1 block text-sm">
                  {opcion.texto}
                </span>
              </span>
            </label>
          ))}
        </div>

        {/* Se oculta y no se quita: si alguien vuelve a «Privada», la
            contrasena que habia escrito sigue ahi. En una publica el servidor
            no la guarda. */}
        <div hidden={!privada}>
          <Campo
            id="accessPassword"
            etiqueta="Contraseña para reservar"
            ayuda={`Al menos ${CONTRASENA_MINIMA} caracteres. Pásasela a tus jugadores; la verás siempre en la gestión de la partida. No uses una contraseña tuya.`}
          >
            <input
              id="accessPassword"
              name="accessPassword"
              type="text"
              maxLength={CONTRASENA_MAXIMA}
              autoComplete="off"
              spellCheck={false}
              defaultValue={texto('accessPassword', valores?.accessPassword ?? '')}
              className={`${CLASE_CONTROL} max-w-xs font-mono`}
              placeholder="12345678"
            />
          </Campo>
        </div>
      </fieldset>

      {campana && (
        <Campo
          id="campaignSummary"
          etiqueta="Sobre la campaña"
          opcional
          ayuda={campana.ayuda}
        >
          <textarea
            id="campaignSummary"
            name="campaignSummary"
            rows={3}
            maxLength={RESUMEN_MAXIMO}
            defaultValue={texto('campaignSummary', campana.resumen)}
            className={CLASE_CONTROL}
            placeholder="De qué va la campaña en dos líneas. Es lo que se ve en su página pública."
          />
        </Campo>
      )}

      {estado && 'error' in estado && <Aviso tono="error">{estado.error}</Aviso>}
      {estado && 'ok' in estado && <Aviso tono="exito">Guardado.</Aviso>}

      <div>
        <Guardar texto={textoBoton} />
      </div>
    </form>
  );
}
