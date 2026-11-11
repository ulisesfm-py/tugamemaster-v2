import { textoPlano } from './contenido';

/**
 * Reglas del blog.
 *
 * Logica pura, sin base de datos, como el resto de politicas del proyecto.
 */

export const TITULO_MINIMO = 5;
export const TITULO_MAXIMO = 140;
export const RESUMEN_MAXIMO = 300;
export const CONTENIDO_MINIMO = 50;
export const CONTENIDO_MAXIMO = 50_000;

export const COMENTARIO_MINIMO = 2;
export const COMENTARIO_MAXIMO = 2000;

/**
 * Quien puede retirar un comentario.
 *
 * Su autor, porque es suyo y puede arrepentirse; y un administrador, porque
 * alguien tiene que poder quitar lo que no deberia estar publicado. Nadie mas.
 */
export function puedeBorrarComentario(
  comentario: { autorId: string },
  quien: { id: string; esAdmin: boolean },
): boolean {
  return quien.esAdmin || comentario.autorId === quien.id;
}

/**
 * Texto que se muestra en el listado.
 *
 * Si el articulo no trae resumen propio se recorta el principio del cuerpo,
 * cortando por un espacio para no partir una palabra por la mitad.
 */
export function resumenDe(
  post: { excerpt: string | null; content: string },
  largo = 200,
): string {
  if (post.excerpt) return post.excerpt;

  const texto = textoPlano(post.content);
  if (texto.length <= largo) return texto;

  const corte = texto.slice(0, largo);
  const ultimoEspacio = corte.lastIndexOf(' ');

  // Si el ultimo espacio queda demasiado atras, es que el texto no tiene
  // espacios donde cortar: mejor un corte seco que devolver cuatro letras.
  const recortado = ultimoEspacio > largo * 0.6 ? corte.slice(0, ultimoEspacio) : corte;

  return `${recortado.trimEnd()}…`;
}
