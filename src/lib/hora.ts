/**
 * La hora de la plataforma: la peninsular española (Europe/Madrid).
 *
 * **Todas las fechas y horas de la web se leen y se escriben aqui.** El
 * servidor de Vercel va en UTC y el navegador de cada cual en su zona, asi que
 * nada puede depender de la zona de la maquina que ejecuta el codigo:
 *
 * - Lo que escribe una persona en un campo de fecha (`datetime-local`, que no
 *   lleva zona) se interpreta como hora peninsular (`desdeHoraPeninsular`).
 *   Antes se leia en la zona del servidor, UTC, y una partida puesta a las
 *   18:00 quedaba a las 19:00 de verdad: la web lo disimulaba porque tambien
 *   ensenaba la hora en UTC, pero los correos, que ya iban en hora de Madrid,
 *   decian 19:00.
 * - Lo que se ensena se formatea en hora peninsular y **lleva la zona escrita**
 *   (`NOMBRE_DE_LA_ZONA`), para que nadie en Canarias o fuera de España tenga
 *   que adivinarla.
 *
 * Logica pura y sin dependencias: sirve igual en el servidor y en el navegador.
 */

export const ZONA_HORARIA = 'Europe/Madrid';

/** Como se nombra la zona junto a una hora. */
export const NOMBRE_DE_LA_ZONA = 'hora peninsular';

type Partes = { anio: number; mes: number; dia: number; hora: number; minuto: number };

const PARTES = new Intl.DateTimeFormat('en-GB', {
  timeZone: ZONA_HORARIA,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
});

/** La fecha tal como se lee en un reloj de Madrid. */
function partesEnMadrid(fecha: Date): Partes & { segundo: number } {
  const valor = (tipo: string) =>
    Number(PARTES.formatToParts(fecha).find((p) => p.type === tipo)?.value ?? 0);

  return {
    anio: valor('year'),
    mes: valor('month'),
    dia: valor('day'),
    hora: valor('hour'),
    minuto: valor('minute'),
    segundo: valor('second'),
  };
}

/** Minutos que Madrid va por delante de UTC en ese instante: 60 o 120. */
function desfaseEnMinutos(instante: Date): number {
  const p = partesEnMadrid(instante);
  const comoSiFueraUtc = Date.UTC(p.anio, p.mes - 1, p.dia, p.hora, p.minuto, p.segundo);
  return Math.round((comoSiFueraUtc - instante.getTime()) / 60_000);
}

const CON_ZONA = /(Z|[+-]\d{2}:?\d{2})$/i;
const SIN_ZONA = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/;

/**
 * Convierte lo que se escribe en un campo de fecha en un instante.
 *
 * "2026-12-05T18:00" son las 18:00 de Madrid, sea invierno o verano. Si el
 * texto ya trae zona (una fecha ISO con «Z», por ejemplo), se respeta. Null si
 * no es una fecha.
 *
 * El cambio de hora tiene dos casos raros. Una hora que no existe (las 02:30
 * del ultimo domingo de marzo) cae una hora despues; una que existe dos veces
 * (las 02:30 del ultimo domingo de octubre) se toma como la primera. A esas
 * horas no empieza ninguna partida, pero la funcion no falla.
 */
export function desdeHoraPeninsular(texto: string): Date | null {
  const limpio = texto.trim();
  if (CON_ZONA.test(limpio)) {
    const fecha = new Date(limpio);
    return Number.isNaN(fecha.getTime()) ? null : fecha;
  }

  const m = SIN_ZONA.exec(limpio);
  if (!m) return null;

  const [anio, mes, dia, hora, minuto, segundo] = m.slice(1).map((v) => Number(v ?? 0));
  if (
    anio === undefined ||
    mes === undefined ||
    dia === undefined ||
    hora === undefined ||
    minuto === undefined
  ) {
    return null;
  }

  const comoSiFueraUtc = Date.UTC(anio, mes - 1, dia, hora, minuto, segundo ?? 0);
  if (Number.isNaN(comoSiFueraUtc)) return null;

  // Dos pasadas: el desfase depende del instante, y el instante del desfase.
  // La primera aproxima; la segunda corrige si entre medias cambia la hora.
  const primera = comoSiFueraUtc - desfaseEnMinutos(new Date(comoSiFueraUtc)) * 60_000;
  const instante = comoSiFueraUtc - desfaseEnMinutos(new Date(primera)) * 60_000;

  return new Date(instante);
}

const dos = (n: number) => String(n).padStart(2, '0');

/** Un instante en el formato de `datetime-local`, en hora peninsular. */
export function paraCampoDeFecha(fecha: Date): string {
  const p = partesEnMadrid(fecha);
  return `${p.anio}-${dos(p.mes)}-${dos(p.dia)}T${dos(p.hora)}:${dos(p.minuto)}`;
}

const FECHA_Y_HORA = new Intl.DateTimeFormat('es-ES', {
  dateStyle: 'long',
  timeStyle: 'short',
  timeZone: ZONA_HORARIA,
});

const FECHA_Y_HORA_CORTA = new Intl.DateTimeFormat('es-ES', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: ZONA_HORARIA,
});

const FECHA_Y_HORA_LARGA = new Intl.DateTimeFormat('es-ES', {
  dateStyle: 'full',
  timeStyle: 'short',
  timeZone: ZONA_HORARIA,
});

const SOLO_FECHA = new Intl.DateTimeFormat('es-ES', {
  dateStyle: 'long',
  timeZone: ZONA_HORARIA,
});

/**
 * Fecha y hora con la zona escrita: "5 de diciembre de 2026, 18:00 (hora
 * peninsular)". `corta` para las tarjetas, `larga` para los correos.
 */
export function fechaYHora(
  fecha: Date,
  formato: 'normal' | 'corta' | 'larga' = 'normal',
): string {
  const formateador =
    formato === 'corta'
      ? FECHA_Y_HORA_CORTA
      : formato === 'larga'
        ? FECHA_Y_HORA_LARGA
        : FECHA_Y_HORA;
  return `${formateador.format(fecha)} (${NOMBRE_DE_LA_ZONA})`;
}

/** Solo la fecha, sin hora, en el calendario de Madrid: "5 de diciembre de 2026". */
export function soloFecha(fecha: Date): string {
  return SOLO_FECHA.format(fecha);
}

/** Un formateador cualquiera, pero siempre en la zona de la plataforma. */
export function formateadorPeninsular(
  opciones: Omit<Intl.DateTimeFormatOptions, 'timeZone'>,
): Intl.DateTimeFormat {
  return new Intl.DateTimeFormat('es-ES', { ...opciones, timeZone: ZONA_HORARIA });
}

/**
 * La misma hora de reloj, unos dias despues: si una sesion fue un sabado a las
 * 18:00, la siguiente se propone el sabado siguiente a las 18:00, aunque entre
 * medias cambie la hora. Sumar siete dias en milisegundos la movia una hora.
 */
export function mismaHoraDentroDe(fecha: Date, dias: number): Date {
  const p = partesEnMadrid(fecha);
  const dia = new Date(Date.UTC(p.anio, p.mes - 1, p.dia + dias));
  const texto = `${dia.getUTCFullYear()}-${dos(dia.getUTCMonth() + 1)}-${dos(dia.getUTCDate())}T${dos(p.hora)}:${dos(p.minuto)}`;
  return desdeHoraPeninsular(texto) ?? new Date(fecha.getTime() + dias * 86_400_000);
}
