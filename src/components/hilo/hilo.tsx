'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { useFormStatus } from 'react-dom';

import { Aviso, Avatar, Button, CLASE_CONTROL, Fundador } from '@/components/ui';
import type { EstadoAccion } from '@/lib/acciones';
import {
  denunciarMensajeAction,
  escribirMensajeAction,
  marcarLeidoAction,
  retirarMensajeAction,
} from '@/modules/threads/actions';
import { MENSAJE_MAXIMO, MOTIVO_DENUNCIA_MAXIMO } from '@/modules/threads/politica';
import type { MensajeDelHilo } from '@/modules/threads/queries';

/**
 * El hilo de una partida.
 *
 * Es cliente solo por lo que necesita serlo: enviar sin recargar, marcar leido
 * al abrir y desplegar el formulario de denuncia. Los mensajes llegan ya
 * resueltos del servidor; no hay sondeo ni conexion abierta.
 */

const FECHA = new Intl.DateTimeFormat('es-ES', {
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
});

function Enviar() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Enviando…' : 'Enviar'}
    </Button>
  );
}

/** Denunciar un mensaje: el boton abre el motivo, y el motivo es obligatorio. */
function Denunciar({ messageId, slug }: { messageId: string; slug: string }) {
  const [abierto, setAbierto] = useState(false);
  const [estado, formAction] = useActionState<EstadoAccion, FormData>(
    denunciarMensajeAction,
    null,
  );

  if (estado && 'ok' in estado) {
    return (
      <p className="text-muted-foreground text-xs">
        {estado.mensaje ?? 'Lo revisará un administrador.'}
      </p>
    );
  }

  if (!abierto) {
    return (
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="text-muted-foreground hover:text-destructive text-xs underline underline-offset-2"
      >
        Denunciar
      </button>
    );
  }

  return (
    <form action={formAction} className="mt-2 flex flex-col gap-2">
      <input type="hidden" name="messageId" value={messageId} />
      <input type="hidden" name="slug" value={slug} />

      <label htmlFor={`motivo-${messageId}`} className="text-muted-foreground text-xs">
        ¿Qué pasa con este mensaje?
      </label>
      <input
        id={`motivo-${messageId}`}
        name="reason"
        required
        maxLength={MOTIVO_DENUNCIA_MAXIMO}
        className={CLASE_CONTROL}
        placeholder="Cuéntalo en una línea"
      />

      {estado && 'error' in estado && <Aviso tono="error">{estado.error}</Aviso>}

      <div className="flex gap-2">
        <Button type="submit" tamano="sm" variante="peligro">
          Enviar denuncia
        </Button>
        <Button
          type="button"
          tamano="sm"
          variante="perfil"
          onClick={() => setAbierto(false)}
        >
          Dejarlo
        </Button>
      </div>
    </form>
  );
}

/** Retirar un mensaje propio. */
function Retirar({ messageId, slug }: { messageId: string; slug: string }) {
  const [estado, formAction] = useActionState<EstadoAccion, FormData>(
    retirarMensajeAction,
    null,
  );

  return (
    <form action={formAction}>
      <input type="hidden" name="messageId" value={messageId} />
      <input type="hidden" name="slug" value={slug} />

      <button
        type="submit"
        className="text-muted-foreground hover:text-destructive text-xs underline underline-offset-2"
      >
        Retirar
      </button>

      {estado && 'error' in estado && (
        <Aviso tono="error" className="mt-2">
          {estado.error}
        </Aviso>
      )}
    </form>
  );
}

function Mensaje({ mensaje, slug }: { mensaje: MensajeDelHilo; slug: string }) {
  if (mensaje.retirado) {
    return (
      <li className="text-muted-foreground border-border border-t py-4 text-sm italic">
        Mensaje retirado.
      </li>
    );
  }

  return (
    <li className="border-border flex gap-3 border-t py-4">
      <Avatar
        src={mensaje.autor.image}
        nombre={mensaje.autor.name}
        tamano={36}
        fundador={mensaje.autor.fundador}
      />

      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-baseline gap-x-2">
          <span className="text-foreground text-sm font-semibold">
            {mensaje.mio ? 'Tú' : mensaje.autor.name}
          </span>
          {mensaje.autor.fundador && <Fundador className="self-center" />}
          <time
            dateTime={mensaje.escritoEn.toISOString()}
            className="text-muted-foreground text-xs"
          >
            {FECHA.format(mensaje.escritoEn)}
          </time>
        </p>

        {/* Texto plano: los saltos de linea se respetan con CSS y no se
            interpreta nada, asi que no hay nada que sanear. */}
        <p className="text-foreground mt-1 text-sm whitespace-pre-line">{mensaje.body}</p>

        <div className="mt-2">
          {mensaje.mio ? (
            <Retirar messageId={mensaje.id} slug={slug} />
          ) : mensaje.denunciado ? (
            <p className="text-muted-foreground text-xs">
              Denunciado. Lo revisa un administrador.
            </p>
          ) : (
            <Denunciar messageId={mensaje.id} slug={slug} />
          )}
        </div>
      </div>
    </li>
  );
}

export function Hilo({
  gameId,
  slug,
  mensajes,
}: {
  gameId: string;
  slug: string;
  mensajes: MensajeDelHilo[];
}) {
  const [estado, formAction] = useActionState<EstadoAccion, FormData>(
    escribirMensajeAction,
    null,
  );
  const formRef = useRef<HTMLFormElement>(null);
  const marcado = useRef(false);

  // Se marca leido al abrir, y una sola vez: la marca dice hasta donde ha
  // leido esta persona, no cuantas veces se ha repintado la pagina.
  useEffect(() => {
    if (marcado.current) return;
    marcado.current = true;
    void marcarLeidoAction(gameId);
  }, [gameId]);

  // Vaciar el campo al enviar: dejarlo escrito invita a mandarlo dos veces.
  useEffect(() => {
    if (estado && 'ok' in estado) formRef.current?.reset();
  }, [estado]);

  return (
    <div>
      {mensajes.length === 0 ? (
        <p className="border-border text-muted-foreground rounded-sm border border-dashed px-6 py-10 text-center text-sm">
          Todavía no ha escrito nadie. Empieza tú.
        </p>
      ) : (
        <ol className="flex flex-col">
          {mensajes.map((m) => (
            <Mensaje key={m.id} mensaje={m} slug={slug} />
          ))}
        </ol>
      )}

      <form
        ref={formRef}
        action={formAction}
        className="border-border mt-6 flex flex-col items-start gap-3 border-t pt-6"
      >
        <input type="hidden" name="gameId" value={gameId} />
        <input type="hidden" name="slug" value={slug} />

        <label htmlFor="mensaje" className="text-foreground text-sm font-medium">
          Escribe en el hilo
        </label>
        <textarea
          id="mensaje"
          name="body"
          rows={3}
          required
          maxLength={MENSAJE_MAXIMO}
          className={CLASE_CONTROL}
          placeholder="Una duda, un aviso, a qué hora te conectas…"
        />

        {estado && 'error' in estado && (
          <Aviso tono="error" className="w-full">
            {estado.error}
          </Aviso>
        )}

        <Enviar />
      </form>
    </div>
  );
}
