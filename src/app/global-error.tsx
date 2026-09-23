'use client';

import { useEffect } from 'react';

import './globals.css';

/**
 * El ultimo recurso: un fallo en el propio layout raiz.
 *
 * Aqui no hay cabecera, ni pie, ni tipografias cargadas, porque lo que ha
 * fallado es justo lo que las monta. Por eso este fichero **reemplaza el
 * documento entero** y tiene que pintar su `<html>` y su `<body>`.
 *
 * Se escribe con los colores puestos a mano y no con los tokens: si lo que se
 * rompio fue la hoja de estilos, un token sin resolver deja texto negro sobre
 * negro. Feo pero legible le gana a bonito pero invisible.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Fallo en el layout raiz:', error);
  }, [error]);

  return (
    <html lang="es">
      <body style={{ background: '#17120e', color: '#f5ece2', margin: 0 }}>
        <main
          style={{
            maxWidth: '32rem',
            margin: '0 auto',
            padding: '5rem 1rem',
            textAlign: 'center',
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>TuGameMaster</h1>

          <p style={{ marginTop: '1rem', color: '#ab9b8a' }}>
            La web no ha podido cargar. Vuelve a intentarlo en un momento.
          </p>

          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: '1.5rem',
              padding: '0.625rem 1.25rem',
              background: '#e2622a',
              color: '#1a0d06',
              border: 0,
              borderRadius: '0.25rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Reintentar
          </button>

          {error.digest && (
            <p style={{ marginTop: '2rem', fontSize: '0.75rem', color: '#8a7b6c' }}>
              Referencia: {error.digest}
            </p>
          )}
        </main>
      </body>
    </html>
  );
}
