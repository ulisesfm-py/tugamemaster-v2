import { z } from 'zod';

/**
 * Validacion de partidas.
 *
 * El precio se introduce en euros (es lo que el GM entiende) pero se guarda en
 * centimos enteros. La conversion vive aqui, en un unico sitio, para que nadie
 * meta un float en la base de datos.
 */

/** Margen minimo entre crear una partida y su inicio. */
export const HORAS_MINIMAS_ANTELACION = 2;

/** Tope de precio por asiento, en centimos. Red de seguridad ante un cero de mas. */
export const PRECIO_MAXIMO_CENTS = 50_000;

const precioEnEuros = z
  .string()
  .trim()
  .min(1, 'Indica el precio por plaza')
  // Acepta "12", "12.5" y "12,50": en Espana la coma es lo natural.
  .transform((v) => Number(v.replace(',', '.')))
  .refine((n) => Number.isFinite(n), 'El precio tiene que ser un numero')
  .refine((n) => n >= 0, 'El precio no puede ser negativo')
  .refine((n) => n <= PRECIO_MAXIMO_CENTS / 100, 'Ese precio parece un error')
  // Redondea a centimos: 12.345 EUR no existe, y guardarlo entero evita
  // descuadres al sumar importes.
  .transform((euros) => Math.round(euros * 100));

export const partidaSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(5, 'El titulo debe tener al menos 5 caracteres')
      .max(120, 'El titulo es demasiado largo'),
    description: z
      .string()
      .trim()
      .min(30, 'Cuenta algo mas: al menos 30 caracteres')
      .max(5000, 'La descripcion es demasiado larga'),
    system: z
      .string()
      .trim()
      .min(2, 'Indica el sistema de juego')
      .max(60, 'El nombre del sistema es demasiado largo'),
    startsAt: z.coerce.date({ message: 'Fecha de inicio invalida' }),
    durationHours: z.coerce
      .number()
      .min(1, 'La partida debe durar al menos 1 hora')
      .max(12, 'Como mucho 12 horas'),
    seatsTotal: z.coerce
      .number()
      .int('El numero de plazas debe ser entero')
      .min(1, 'Tiene que haber al menos 1 plaza')
      .max(12, 'Como mucho 12 plazas'),
    priceCents: precioEnEuros,
  })
  .refine(
    (d) => d.startsAt.getTime() >= Date.now() + HORAS_MINIMAS_ANTELACION * 60 * 60 * 1000,
    {
      message: `La partida debe empezar dentro de al menos ${HORAS_MINIMAS_ANTELACION} horas`,
      path: ['startsAt'],
    },
  );

export type PartidaInput = z.infer<typeof partidaSchema>;

/** Filtros del listado publico. Todos opcionales. */
export const filtrosSchema = z.object({
  q: z.string().trim().max(80).optional(),
  system: z.string().trim().max(60).optional(),
  /** Precio maximo por plaza, en euros. */
  maxPrecio: z.coerce.number().nonnegative().optional(),
  /** Solo partidas con plazas libres. */
  soloLibres: z.boolean().optional(),
});

export type Filtros = z.infer<typeof filtrosSchema>;
