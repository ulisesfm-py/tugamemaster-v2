import { slugify } from '@/modules/users/slug';

/**
 * Los sistemas de juego, como direccion de una pagina.
 *
 * `Game.system` es texto libre: lo escribe cada game master. Eso significa que
 * «D&D 5e», «D&D 5E» y «D&D  5e» son la misma cosa escrita de tres maneras, y
 * que no hay una tabla de sistemas que consultar.
 *
 * La solucion es no guardar nada y **agrupar por slug**: dos grafias que dan
 * el mismo slug son el mismo sistema. Asi la pagina de un sistema reune las
 * partidas de todos los que lo escribieron parecido, sin obligar a nadie a
 * elegir de una lista cerrada ni tener que limpiar la base a mano.
 */

/** La direccion de un sistema. «D&D 5e» -> «d-d-5e». */
export function slugDeSistema(nombre: string): string {
  return slugify(nombre);
}

export type Sistema = {
  slug: string;
  /** La grafia mas usada, que es la que se ensena. */
  nombre: string;
  /** Todas las formas de escribirlo que hay en la base. */
  variantes: string[];
  /** Cuantas partidas lo usan, sumando variantes. */
  partidas: number;
};

/** Cuantas mayusculas tiene un nombre. Sirve de desempate entre grafias. */
function mayusculas(texto: string): number {
  return [...texto].filter((c) => c !== c.toLowerCase() && c === c.toUpperCase()).length;
}

/**
 * Agrupa grafias sueltas en sistemas.
 *
 * De nombre se queda la mas usada, no la primera: si nueve personas escriben
 * «Vaesen» y una «vaesen», manda la de las nueve.
 *
 * A igualdad de uso gana la que tenga mas mayusculas. Un sistema de juego es
 * un nombre propio, asi que «Vaesen» es mejor titulo que «vaesen»; dejarlo al
 * orden alfabetico daba justo lo contrario, porque en espanol la minuscula va
 * antes. El tercer criterio es alfabetico, para que la lista no baile entre
 * recargas.
 */
export function agrupaSistemas(
  filas: readonly { system: string; partidas: number }[],
): Sistema[] {
  const porSlug = new Map<string, { system: string; partidas: number }[]>();

  for (const fila of filas) {
    const slug = slugDeSistema(fila.system);
    if (!slug) continue;

    const grupo = porSlug.get(slug);
    if (grupo) grupo.push(fila);
    else porSlug.set(slug, [fila]);
  }

  const sistemas = [...porSlug.entries()].map(([slug, grupo]) => {
    const ordenadas = [...grupo].sort(
      (a, b) =>
        b.partidas - a.partidas ||
        mayusculas(b.system) - mayusculas(a.system) ||
        a.system.localeCompare(b.system, 'es'),
    );

    return {
      slug,
      nombre: ordenadas[0]?.system ?? slug,
      variantes: ordenadas.map((g) => g.system),
      partidas: grupo.reduce((suma, g) => suma + g.partidas, 0),
    };
  });

  return sistemas.sort(
    (a, b) => b.partidas - a.partidas || a.nombre.localeCompare(b.nombre, 'es'),
  );
}
