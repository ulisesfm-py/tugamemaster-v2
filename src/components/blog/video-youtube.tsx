'use client';

import { useState } from 'react';

/**
 * Video de YouTube que no se carga hasta que el lector lo pide.
 *
 * Mientras no se pulsa, la pagina no contacta con YouTube: no hay iframe, ni
 * miniatura de sus servidores, ni cookies. Solo al pulsar se monta el
 * reproductor, y del dominio `youtube-nocookie.com`. Es lo que permite no
 * pedir permiso de cookies al entrar (ver /privacidad).
 */
export function VideoYoutube({ id, titulo }: { id: string; titulo: string }) {
  const [activo, setActivo] = useState(false);

  if (activo) {
    return (
      <iframe
        src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`}
        title={titulo}
        allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
        referrerPolicy="strict-origin-when-cross-origin"
        className="border-border aspect-video w-full rounded-sm border"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setActivo(true)}
      aria-label={`Reproducir el vídeo: ${titulo}`}
      className="border-border bg-card hover:border-primary/60 focus-visible:ring-ring group flex aspect-video w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-sm border px-4 text-center transition-colors focus-visible:ring-2 focus-visible:outline-none"
    >
      <span className="bg-primary text-primary-foreground flex size-14 items-center justify-center rounded-full transition-transform group-hover:scale-105">
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          className="ml-0.5 size-6"
          aria-hidden
        >
          <path d="M8 5v14l11-7z" />
        </svg>
      </span>
      <span className="text-foreground font-medium">Ver el vídeo</span>
      <span className="text-muted-foreground max-w-xs text-xs">
        Al reproducirlo se carga YouTube y puede guardar cookies.
      </span>
    </button>
  );
}
