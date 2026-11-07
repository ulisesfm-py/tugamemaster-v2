import type { MetadataRoute } from 'next';

/**
 * robots.txt.
 *
 * Deja rastrear lo publico **siempre**, tambien mientras la web no se indexa:
 * lo que la saca de Google es la etiqueta `noindex` de cada pagina (ver
 * `src/lib/indexacion.ts`), y un buscador solo la ve si puede entrar a leerla.
 * Un `Disallow: /` la esconderia y dejaria la URL en el indice sin contenido.
 *
 * Lo privado no se rastrea nunca: no hay nada que indexar detras de un inicio
 * de sesion.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/admin', '/cuenta', '/dashboard', '/mis-reservas', '/r/'],
    },
  };
}
