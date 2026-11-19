import { z } from 'zod';

import {
  camposDeFicha,
  fechaPeninsular,
  plazas,
  precioEnEuros,
} from '@/modules/games/schema';

import {
  DURACION_MAXIMA_MINUTOS,
  DURACION_MINIMA_MINUTOS,
  minimoValido,
} from './politica';

/**
 * Validacion de una mesa con fecha flexible.
 *
 * La ficha (que se juega y para quien) es la misma que la de una partida y se
 * valida con los mismos campos. Cambia el «cuando»: en vez de una fecha, una
 * franja orientativa y un minimo de jugadores.
 */

export const FRECUENCIAS = ['UNICA', 'SEMANAL', 'QUINCENAL'] as const;

/** "10:30" -> 630. Lo que no sea una hora valida no pasa. */
const horaDelDia = z
  .string()
  .trim()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Indica la hora de inicio')
  .transform((v) => {
    const [h = 0, m = 0] = v.split(':').map(Number);
    return h * 60 + m;
  });

export const convocatoriaSchema = z
  .object({
    ...camposDeFicha,
    seatsTotal: plazas,
    minPlayers: z.coerce
      .number({ message: 'Indica el mínimo de jugadores' })
      .int('El mínimo tiene que ser un número entero'),
    priceCents: precioEnEuros,
    weekdays: z
      .array(z.coerce.number().int())
      .min(1, 'Elige al menos un día de la semana')
      .refine(
        (dias) =>
          dias.every((d) => d >= 1 && d <= 7) && new Set(dias).size === dias.length,
        'Los días de la semana no son válidos',
      ),
    startMinute: horaDelDia,
    // En horas, como en una partida; se guarda en minutos enteros.
    durationMinutes: z.coerce
      .number({ message: 'Indica cuánto dura la sesión' })
      .transform((horas) => Math.round(horas * 60))
      .refine(
        (min) => min >= DURACION_MINIMA_MINUTOS && min <= DURACION_MAXIMA_MINUTOS,
        `La sesión tiene que durar entre ${DURACION_MINIMA_MINUTOS / 60} y ${DURACION_MAXIMA_MINUTOS / 60} horas`,
      ),
    frequency: z.enum(FRECUENCIAS, { message: 'Elige cada cuánto se jugaría' }),
  })
  .refine((d) => minimoValido(d.minPlayers, d.seatsTotal), {
    message: 'El mínimo de jugadores tiene que estar entre 1 y el número de plazas',
    path: ['minPlayers'],
  });

export type ConvocatoriaInput = z.infer<typeof convocatoriaSchema>;

/** Lo que manda el formulario de la mesa flexible, tal cual. */
export function datosDeConvocatoria(formData: FormData) {
  return {
    title: String(formData.get('title') ?? ''),
    description: String(formData.get('description') ?? ''),
    system: String(formData.get('system') ?? ''),
    languages: formData.getAll('languages').map(String),
    tags: formData.getAll('tags').map(String),
    experience: String(formData.get('experience') ?? ''),
    minAge: String(formData.get('minAge') ?? ''),
    seatsTotal: String(formData.get('seatsTotal') ?? ''),
    minPlayers: String(formData.get('minPlayers') ?? ''),
    priceCents: String(formData.get('price') ?? ''),
    weekdays: formData.getAll('weekdays').map(String),
    startMinute: String(formData.get('startTime') ?? ''),
    durationMinutes: String(formData.get('durationHours') ?? ''),
    frequency: String(formData.get('frequency') ?? ''),
  };
}

/** La fecha que fija el GM al convocar. La antelacion la comprueba la politica. */
export const convocarSchema = z.object({
  startsAt: fechaPeninsular('Indica la fecha y la hora de la partida'),
});
