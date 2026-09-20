/**
 * La ficha tecnica de una partida.
 *
 * Responde a «¿es esta mesa para mi?» antes de que nadie lea la descripcion:
 * cuanta soltura se presupone, en que idioma se juega, cuanto dura, de que va.
 * Era la mayor laguna de contenido de la web (ver docs/diseno.md, D1c).
 *
 * Todo lo de aqui es logica pura y sin dependencias: lo usan el formulario del
 * game master (cliente), la pagina publica (servidor) y las pruebas.
 *
 * Las etiquetas son **vocabulario cerrado**. Texto libre daria «Terror»,
 * «terror» y «TERROR» como tres cosas distintas, y con eso no se puede
 * filtrar ni agrupar. El grupo al que pertenece cada etiqueta vive aqui y no
 * en la base de datos: en `Game` hay una sola columna.
 */

/**
 * A partir de cuantas plazas libres se deja de meter prisa.
 *
 * Lo comparten la tarjeta —que dice «queda 1 plaza»— y el filtro de «ultimas
 * plazas» del listado. Si se separaran, alguien filtraria por ultimas plazas y
 * le saldrian mesas que no lo parecen.
 */
export const PLAZAS_POCAS = 2;

export const EXPERIENCIA = {
  ABIERTA: {
    titulo: 'Abierta a todos',
    explicacion: 'Se explica todo. Si nunca has jugado, esta es tu mesa.',
  },
  ALGUNA: {
    titulo: 'Con algo de rodaje',
    explicacion: 'Conviene haber jugado antes, aunque fuera a otro sistema.',
  },
  VETERANA: {
    titulo: 'Para gente con soltura',
    explicacion: 'Se da por sabido el sistema; no se para a explicarlo.',
  },
} as const;

export type Experiencia = keyof typeof EXPERIENCIA;

export const EXPERIENCIAS = Object.keys(EXPERIENCIA) as Experiencia[];

export function esExperiencia(valor: string): valor is Experiencia {
  return valor in EXPERIENCIA;
}

/** Los dos grupos de etiquetas, con el nombre que se ensena de cada uno. */
export const GRUPOS = {
  estilo: 'A qué se juega',
  tema: 'De qué va',
} as const;

export type Grupo = keyof typeof GRUPOS;

export const ETIQUETAS: readonly { id: string; texto: string; grupo: Grupo }[] = [
  { id: 'combate', texto: 'Combate', grupo: 'estilo' },
  { id: 'interpretacion', texto: 'Interpretación', grupo: 'estilo' },
  { id: 'exploracion', texto: 'Exploración', grupo: 'estilo' },
  { id: 'investigacion', texto: 'Investigación', grupo: 'estilo' },
  { id: 'intriga', texto: 'Intriga política', grupo: 'estilo' },
  { id: 'supervivencia', texto: 'Supervivencia', grupo: 'estilo' },
  { id: 'puzles', texto: 'Puzles', grupo: 'estilo' },
  { id: 'sandbox', texto: 'Mundo abierto', grupo: 'estilo' },
  { id: 'fantasia', texto: 'Fantasía', grupo: 'tema' },
  { id: 'fantasia-oscura', texto: 'Fantasía oscura', grupo: 'tema' },
  { id: 'terror', texto: 'Terror', grupo: 'tema' },
  { id: 'ciencia-ficcion', texto: 'Ciencia ficción', grupo: 'tema' },
  { id: 'cyberpunk', texto: 'Cyberpunk', grupo: 'tema' },
  { id: 'historico', texto: 'Histórico', grupo: 'tema' },
  { id: 'western', texto: 'Western', grupo: 'tema' },
  { id: 'humor', texto: 'Humor', grupo: 'tema' },
  { id: 'misterio', texto: 'Misterio', grupo: 'tema' },
  { id: 'epico', texto: 'Épico', grupo: 'tema' },
];

/**
 * Cuantas etiquetas se admiten por partida.
 *
 * El tope no es capricho: una mesa etiquetada con doce cosas no dice nada, y
 * en la tarjeta no caben. Obligar a elegir mejora lo que se ensena.
 */
export const MAXIMO_ETIQUETAS = 5;

const POR_ID = new Map(ETIQUETAS.map((e) => [e.id, e]));

export function esEtiqueta(id: string): boolean {
  return POR_ID.has(id);
}

/** Las etiquetas guardadas, en el orden del vocabulario y sin las que ya no existan. */
export function etiquetasDe(ids: readonly string[]) {
  return ETIQUETAS.filter((e) => ids.includes(e.id));
}

/** Las mismas, repartidas por grupo. Un grupo sin etiquetas no aparece. */
export function etiquetasPorGrupo(ids: readonly string[]) {
  const elegidas = etiquetasDe(ids);

  return (Object.keys(GRUPOS) as Grupo[])
    .map((grupo) => ({
      grupo,
      titulo: GRUPOS[grupo],
      etiquetas: elegidas.filter((e) => e.grupo === grupo),
    }))
    .filter((g) => g.etiquetas.length > 0);
}

/** Idiomas en los que se puede dirigir una mesa. */
export const IDIOMAS: readonly { codigo: string; texto: string }[] = [
  { codigo: 'es', texto: 'Español' },
  { codigo: 'ca', texto: 'Català' },
  { codigo: 'gl', texto: 'Galego' },
  { codigo: 'eu', texto: 'Euskara' },
  { codigo: 'en', texto: 'Inglés' },
  { codigo: 'pt', texto: 'Portugués' },
  { codigo: 'fr', texto: 'Francés' },
  { codigo: 'it', texto: 'Italiano' },
];

const IDIOMA_POR_CODIGO = new Map(IDIOMAS.map((i) => [i.codigo, i.texto]));

export function esIdioma(codigo: string): boolean {
  return IDIOMA_POR_CODIGO.has(codigo);
}

/** Nombre del idioma. Un codigo desconocido se ensena tal cual, en mayusculas. */
export function nombreDeIdioma(codigo: string): string {
  return IDIOMA_POR_CODIGO.get(codigo) ?? codigo.toUpperCase();
}

/**
 * Los idiomas de la mesa.
 *
 * Si la partida no declara ninguno —las creadas antes de que existiera este
 * campo— se cae a los del game master, que es lo que se ensenaba hasta ahora.
 */
export function idiomasDeLaMesa(
  deLaPartida: readonly string[],
  delGm: readonly string[],
): string[] {
  const codigos = deLaPartida.length > 0 ? deLaPartida : delGm;
  return codigos.map(nombreDeIdioma);
}

/** Duracion en horas, redondeada a la media hora. */
export function duracionEnHoras(startsAt: Date, endsAt: Date): number {
  const horas = (endsAt.getTime() - startsAt.getTime()) / 3_600_000;
  return Math.round(horas * 2) / 2;
}

/** «3 h», «3 h 30 min». Cero o negativo no se ensena. */
export function textoDeDuracion(startsAt: Date, endsAt: Date): string | null {
  const horas = duracionEnHoras(startsAt, endsAt);
  if (horas <= 0) return null;

  const enteras = Math.floor(horas);
  const media = horas - enteras >= 0.5;

  if (enteras === 0) return '30 min';
  return media ? `${enteras} h 30 min` : `${enteras} h`;
}

/** «A partir de 16 años». Sin minimo, no se dice nada. */
export function textoDeEdad(minAge: number | null): string | null {
  if (minAge === null || minAge <= 0) return null;
  return `A partir de ${minAge} años`;
}

/**
 * Que clase de mesa es, en una palabra.
 *
 * No hay campo que lo diga: se deduce. Una partida que pertenece a una campana
 * o que continua a otra es una sesion de campana; el resto son partidas
 * sueltas. Es la primera pregunta de quien mira, y hasta ahora no se
 * contestaba en ningun sitio.
 */
export function tipoDeMesa(partida: {
  campaignId?: string | null;
  previousGameId?: string | null;
  sessionNumber?: number | null;
}): { texto: string; explicacion: string } {
  if (partida.campaignId || partida.previousGameId) {
    const numero = partida.sessionNumber;

    return {
      texto: numero ? `Campaña · sesión ${numero}` : 'Sesión de campaña',
      explicacion: 'Continúa una historia ya empezada.',
    };
  }

  return {
    texto: 'Partida suelta',
    explicacion: 'Empieza y termina el mismo día. No hay que comprometerse a más.',
  };
}
