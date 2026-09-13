/**
 * Genera el identificador publico que aparece en la URL del perfil.
 */

/** Marcas diacriticas de Unicode (acentos, dieresis, la virgulilla de la enye). */
const DIACRITICOS = new RegExp('[\u0300-\u036f]', 'g');

/** Convierte un texto libre en un slug seguro para URL. */
export function slugify(texto: string): string {
  return (
    texto
      .normalize('NFD')
      // Elimina los diacriticos: "Nunez" con tilde -> "Nunez".
      // El rango se construye con RegExp para que los caracteres combinantes
      // no acaben escritos literalmente en el fuente, donde son invisibles.
      .replace(DIACRITICOS, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 48)
  );
}

/**
 * Devuelve un slug libre a partir de un nombre, anadiendo un sufijo numerico
 * si ya esta ocupado: "ana-soto", "ana-soto-2", "ana-soto-3"...
 *
 * `estaOcupado` se inyecta para que esta funcion sea pura y testeable sin
 * base de datos.
 */
export async function slugDisponible(
  nombre: string,
  estaOcupado: (slug: string) => Promise<boolean>,
): Promise<string> {
  const base = slugify(nombre) || 'usuario';

  if (!(await estaOcupado(base))) return base;

  for (let sufijo = 2; sufijo < 1000; sufijo++) {
    const candidato = `${base}-${sufijo}`;
    if (!(await estaOcupado(candidato))) return candidato;
  }

  // Con 998 colisiones del mismo nombre, dejamos de intentar adivinar.
  return `${base}-${Date.now().toString(36)}`;
}
