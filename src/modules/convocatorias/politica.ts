import type {
  EstadoConvocatoria,
  FrecuenciaConvocatoria,
} from '@/generated/prisma/enums';

/**
 * Reglas de las mesas con fecha flexible («convocatorias»).
 *
 * Una mesa sin fecha junta pre-reservas gratuitas. Al llegar al minimo, el GM
 * fija una fecha y se crea una partida normal; durante un plazo solo pueden
 * reservarla (y pagarla) quienes se pre-reservaron. Despues, cualquiera.
 *
 * Logica pura: ni base de datos ni reloj propio. Quien la usa le pasa la
 * fecha, para poder comprobarla sin montar nada.
 *
 * Las cifras de arriba son las que se ajustaran con lo que diga la gente:
 * cambiarlas es cambiar una linea, y las pruebas las leen de aqui.
 */

/** Horas que tienen los pre-reservados para reservar, desde que se convoca. */
export const HORAS_PARA_RESERVAR = 48;

/**
 * Antelacion minima de la fecha que fija el GM.
 *
 * Tiene que dejar sitio al plazo para reservar y, despues, a las 48 horas de
 * cancelacion con devolucion de cualquier partida: quien reserva el ultimo
 * momento del plazo todavia puede echarse atras.
 */
export const DIAS_MINIMOS_DE_ANTELACION = 5;

/** Mesas flexibles a las que una persona puede estar apuntada a la vez. */
export const PRERESERVAS_MAXIMAS = 5;

/** Una mesa abierta que nadie convoca deja de listarse pasado este tiempo. */
export const DIAS_EN_EL_LISTADO = 90;

/** Limites de la franja. Los mismos que la duracion de una partida normal. */
export const DURACION_MINIMA_MINUTOS = 60;
export const DURACION_MAXIMA_MINUTOS = 12 * 60;

const HORA = 3_600_000;
const DIA = 24 * HORA;

/* ── Pre-reservarse ─────────────────────────────────────────────────────── */

export type MotivoSinPreReserva =
  'NO_ABIERTA' | 'ES_TU_MESA' | 'YA_APUNTADO' | 'LLENA' | 'DEMASIADAS';

export type Resultado<M extends string> =
  { ok: true } | { ok: false; motivo: M; mensaje: string };

/** Si alguien puede pre-reservarse en una mesa flexible. */
export function puedePreReservar(datos: {
  estado: EstadoConvocatoria;
  plazas: number;
  apuntados: number;
  yaApuntado: boolean;
  esSuGm: boolean;
  /** Mesas abiertas en las que ya esta apuntado, sin contar esta. */
  activasDelJugador: number;
}): Resultado<MotivoSinPreReserva> {
  if (datos.estado !== 'ABIERTA') {
    return {
      ok: false,
      motivo: 'NO_ABIERTA',
      mensaje: 'Esta mesa ya no admite pre-reservas',
    };
  }

  if (datos.esSuGm) {
    return {
      ok: false,
      motivo: 'ES_TU_MESA',
      mensaje: 'No puedes pre-reservar en tu propia mesa',
    };
  }

  if (datos.yaApuntado) {
    return {
      ok: false,
      motivo: 'YA_APUNTADO',
      mensaje: 'Ya tienes una pre-reserva aquí',
    };
  }

  if (datos.apuntados >= datos.plazas) {
    return {
      ok: false,
      motivo: 'LLENA',
      mensaje: 'La mesa está completa: no quedan pre-reservas',
    };
  }

  if (datos.activasDelJugador >= PRERESERVAS_MAXIMAS) {
    return {
      ok: false,
      motivo: 'DEMASIADAS',
      mensaje: `Puedes tener como mucho ${PRERESERVAS_MAXIMAS} pre-reservas a la vez. Borra alguna para apuntarte aquí.`,
    };
  }

  return { ok: true };
}

/* ── El minimo ──────────────────────────────────────────────────────────── */

/** Si el minimo es coherente con las plazas. */
export function minimoValido(minimo: number, plazas: number): boolean {
  return Number.isInteger(minimo) && minimo >= 1 && minimo <= plazas;
}

export function alcanzaElMinimo(apuntados: number, minimo: number): boolean {
  return apuntados >= minimo;
}

/**
 * Si toca avisar al GM de que ya puede convocar.
 *
 * Una sola vez por mesa: si alguien se borra y otro completa de nuevo, el GM
 * ya lo sabe.
 */
export function hayQueAvisarDelMinimo(datos: {
  estado: EstadoConvocatoria;
  apuntados: number;
  minimo: number;
  avisadoEn: Date | null;
}): boolean {
  return (
    datos.estado === 'ABIERTA' &&
    datos.avisadoEn === null &&
    alcanzaElMinimo(datos.apuntados, datos.minimo)
  );
}

/* ── Convocar ───────────────────────────────────────────────────────────── */

export type MotivoSinConvocar = 'NO_ABIERTA' | 'FALTA_GENTE' | 'FECHA_PRONTO';

/** La fecha mas temprana que el GM puede fijar al convocar. */
export function primeraFechaPosible(ahora: Date): Date {
  return new Date(ahora.getTime() + DIAS_MINIMOS_DE_ANTELACION * DIA);
}

/** Si el GM puede convocar la mesa para `fecha`. */
export function puedeConvocar(datos: {
  estado: EstadoConvocatoria;
  apuntados: number;
  minimo: number;
  fecha: Date;
  ahora: Date;
}): Resultado<MotivoSinConvocar> {
  if (datos.estado !== 'ABIERTA') {
    return {
      ok: false,
      motivo: 'NO_ABIERTA',
      mensaje: 'Esta mesa ya no se puede convocar',
    };
  }

  if (!alcanzaElMinimo(datos.apuntados, datos.minimo)) {
    const faltan = datos.minimo - datos.apuntados;
    return {
      ok: false,
      motivo: 'FALTA_GENTE',
      mensaje: `Faltan ${faltan} ${faltan === 1 ? 'pre-reserva' : 'pre-reservas'} para llegar al mínimo`,
    };
  }

  if (datos.fecha.getTime() < primeraFechaPosible(datos.ahora).getTime()) {
    return {
      ok: false,
      motivo: 'FECHA_PRONTO',
      mensaje: `La fecha tiene que ser al menos dentro de ${DIAS_MINIMOS_DE_ANTELACION} días, para que dé tiempo a reservar`,
    };
  }

  return { ok: true };
}

/** Hasta cuando solo reservan los pre-reservados, contando desde que se convoca. */
export function finDelPlazoParaReservar(convocadaEn: Date): Date {
  return new Date(convocadaEn.getTime() + HORAS_PARA_RESERVAR * HORA);
}

/* ── Reservar la partida convocada ──────────────────────────────────────── */

/** Si la partida esta todavia en su plazo reservado a los pre-reservados. */
export function enPlazoDePreReservados(priorityUntil: Date | null, ahora: Date): boolean {
  return priorityUntil !== null && ahora.getTime() < priorityUntil.getTime();
}

/**
 * Si alguien puede reservar una partida que salio de una mesa flexible.
 *
 * Durante el plazo, solo quien se pre-reservo; despues, como cualquier
 * partida. Las plazas que nadie haya pedido esperan al final del plazo: es la
 * regla mas sencilla, y dos dias de espera apenas cuestan.
 */
export function puedeReservarConvocada(datos: {
  priorityUntil: Date | null;
  tienePreReserva: boolean;
  ahora: Date;
}): boolean {
  return (
    !enPlazoDePreReservados(datos.priorityUntil, datos.ahora) || datos.tienePreReserva
  );
}

/* ── Editar con gente apuntada ──────────────────────────────────────────── */

/**
 * Lo que no se puede cambiar de una mesa con pre-reservas.
 *
 * La gente se apunto con un precio y unas plazas: el precio no sube y las
 * plazas no bajan. Lo contrario si, porque solo les favorece. Devuelve la
 * lista de problemas; vacia si el cambio vale.
 */
export function problemasAlEditar(datos: {
  apuntados: number;
  precioActual: number;
  precioNuevo: number;
  plazasActuales: number;
  plazasNuevas: number;
  minimoNuevo: number;
}): string[] {
  const problemas: string[] = [];

  if (datos.apuntados > 0 && datos.precioNuevo > datos.precioActual) {
    problemas.push('Con gente apuntada no se puede subir el precio');
  }

  if (datos.apuntados > 0 && datos.plazasNuevas < datos.plazasActuales) {
    problemas.push('Con gente apuntada no se pueden quitar plazas');
  }

  if (!minimoValido(datos.minimoNuevo, datos.plazasNuevas)) {
    problemas.push('El mínimo tiene que estar entre 1 y el número de plazas');
  }

  return problemas;
}

/* ── El listado ─────────────────────────────────────────────────────────── */

/** Si una mesa abierta sigue saliendo en el listado. */
export function sigueEnElListado(publicadaEn: Date, ahora: Date): boolean {
  return ahora.getTime() - publicadaEn.getTime() < DIAS_EN_EL_LISTADO * DIA;
}

/* ── La franja ──────────────────────────────────────────────────────────── */

export type Franja = {
  /** Dias ISO: 1 = lunes, 7 = domingo. */
  weekdays: number[];
  /** Minutos desde medianoche, en hora de Madrid. */
  startMinute: number;
  durationMinutes: number;
  frequency: FrecuenciaConvocatoria;
};

/** Lo que falla en una franja; vacio si vale. */
export function problemasDeLaFranja(franja: Omit<Franja, 'frequency'>): string[] {
  const problemas: string[] = [];
  const { weekdays, startMinute, durationMinutes } = franja;

  if (weekdays.length === 0) {
    problemas.push('Elige al menos un día de la semana');
  } else if (
    !weekdays.every((d) => Number.isInteger(d) && d >= 1 && d <= 7) ||
    new Set(weekdays).size !== weekdays.length
  ) {
    problemas.push('Los días de la semana no son válidos');
  }

  if (!Number.isInteger(startMinute) || startMinute < 0 || startMinute >= 24 * 60) {
    problemas.push('La hora de inicio no es válida');
  }

  if (
    !Number.isInteger(durationMinutes) ||
    durationMinutes < DURACION_MINIMA_MINUTOS ||
    durationMinutes > DURACION_MAXIMA_MINUTOS
  ) {
    problemas.push(
      `La duración tiene que estar entre ${DURACION_MINIMA_MINUTOS / 60} y ${DURACION_MAXIMA_MINUTOS / 60} horas`,
    );
  }

  return problemas;
}

const DIAS_EN_PLURAL = [
  'lunes',
  'martes',
  'miércoles',
  'jueves',
  'viernes',
  'sábados',
  'domingos',
];

const FRECUENCIA: Record<FrecuenciaConvocatoria, string> = {
  UNICA: 'una sola sesión',
  SEMANAL: 'cada semana',
  QUINCENAL: 'cada dos semanas',
};

/** 600 -> "10:00". Pasada la medianoche vuelve a empezar: 1500 -> "01:00". */
export function hora(minutos: number): string {
  const enElDia = ((minutos % 1440) + 1440) % 1440;
  const h = Math.floor(enElDia / 60);
  const m = enElDia % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** Los dias, en orden de la semana: [6, 5] -> "Viernes y sábados". */
export function describirDias(weekdays: number[]): string {
  const nombres = [...new Set(weekdays)]
    .sort((a, b) => a - b)
    .flatMap((d) => DIAS_EN_PLURAL[d - 1] ?? []);

  const ultimo = nombres.pop();
  if (ultimo === undefined) return '';

  const texto = nombres.length === 0 ? ultimo : `${nombres.join(', ')} y ${ultimo}`;

  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

/** "Sábados, de 10:00 a 13:00 · cada dos semanas". */
export function describirFranja(franja: Franja): string {
  const fin = franja.startMinute + franja.durationMinutes;
  return `${describirDias(franja.weekdays)}, de ${hora(franja.startMinute)} a ${hora(fin)} · ${FRECUENCIA[franja.frequency]}`;
}
