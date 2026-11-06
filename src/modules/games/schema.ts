import { z } from 'zod';

import { EXPERIENCIAS, MAXIMO_ETIQUETAS, esEtiqueta, esIdioma } from './ficha';

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

/** Longitud de la contrasena de una partida privada. */
export const CONTRASENA_MINIMA = 4;
export const CONTRASENA_MAXIMA = 40;

export const VISIBILIDADES = ['PUBLICA', 'PRIVADA'] as const;

const precioEnEuros = z
  .string()
  .trim()
  .min(1, 'Indica el precio por plaza')
  // Acepta "12", "12.5" y "12,50": en Espana la coma es lo natural.
  .transform((v) => Number(v.replace(',', '.')))
  .refine((n) => Number.isFinite(n), 'El precio tiene que ser un número')
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
      .min(5, 'El título debe tener al menos 5 caracteres')
      .max(120, 'El título es demasiado largo'),
    description: z
      .string()
      .trim()
      .min(30, 'Cuenta algo más: al menos 30 caracteres')
      .max(5000, 'La descripción es demasiado larga'),
    system: z
      .string()
      .trim()
      .min(2, 'Indica el sistema de juego')
      .max(60, 'El nombre del sistema es demasiado largo'),
    startsAt: z.coerce.date({ message: 'Fecha de inicio inválida' }),
    durationHours: z.coerce
      .number()
      .min(1, 'La partida debe durar al menos 1 hora')
      .max(12, 'Como mucho 12 horas'),
    seatsTotal: z.coerce
      .number()
      .int('El número de plazas debe ser entero')
      .min(1, 'Tiene que haber al menos 1 plaza')
      .max(12, 'Como mucho 12 plazas'),
    priceCents: precioEnEuros,

    // Vocabulario cerrado: ver `ficha.ts`. Lo que no este en la lista se
    // rechaza en vez de guardarse, porque llega de un formulario y cualquiera
    // puede mandar lo que quiera.
    languages: z
      .array(z.string())
      .min(1, 'Elige al menos un idioma')
      .max(4, 'Como mucho cuatro idiomas')
      .refine((ids) => ids.every(esIdioma), 'Ese idioma no está en la lista'),
    // Con mensaje propio: el de serie sale en ingles y enumera las constantes
    // del modelo, que no significan nada para quien publica una partida.
    experience: z.enum(EXPERIENCIAS, {
      message: 'Elige qué experiencia se le presupone a la mesa',
    }),
    tags: z
      .array(z.string())
      .max(MAXIMO_ETIQUETAS, `Como mucho ${MAXIMO_ETIQUETAS} etiquetas`)
      .refine((ids) => ids.every(esEtiqueta), 'Esa etiqueta no está en la lista')
      .refine((ids) => new Set(ids).size === ids.length, 'Hay una etiqueta repetida'),
    // Vacio significa «sin minimo», no cero: la edad es opcional y un
    // formulario manda cadena vacia, no ausencia. Se normaliza antes de
    // validar para que el mensaje de error hable de edades y no de uniones.
    minAge: z.preprocess(
      (v) => (v === '' || v === null || v === undefined ? null : v),
      z.coerce
        .number()
        .int('La edad mínima tiene que ser un número entero')
        .min(6, 'Una edad mínima por debajo de 6 años no dice nada')
        .max(99, 'Esa edad mínima parece un error')
        .nullable(),
    ),
    visibility: z.enum(VISIBILIDADES, {
      message: 'Elige si la partida es pública o privada',
    }),
    // Se valida aparte, abajo, porque solo importa en una privada.
    accessPassword: z
      .string()
      .trim()
      .max(CONTRASENA_MAXIMA, 'La contraseña es demasiado larga'),
  })
  .refine(
    (d) => d.visibility === 'PUBLICA' || d.accessPassword.length >= CONTRASENA_MINIMA,
    {
      message: `Una partida privada necesita una contraseña de al menos ${CONTRASENA_MINIMA} caracteres`,
      path: ['accessPassword'],
    },
  )
  .refine(
    (d) => d.startsAt.getTime() >= Date.now() + HORAS_MINIMAS_ANTELACION * 60 * 60 * 1000,
    {
      message: `La partida debe empezar dentro de al menos ${HORAS_MINIMAS_ANTELACION} horas`,
      path: ['startsAt'],
    },
  );

export type PartidaInput = z.infer<typeof partidaSchema>;

/**
 * Lo que manda el formulario de partida, tal cual, para `partidaSchema`.
 *
 * Vive aqui y no en cada accion porque son dos —crear o editar una partida, y
 * continuar una campana— y usan el mismo formulario. Cuando cada una leia los
 * campos por su cuenta, la de campanas se quedo sin los que se anadieron
 * despues (idiomas, etiquetas, experiencia, edad) y no habia forma de crear
 * una continuacion: la validacion la rechazaba siempre.
 */
export function datosDelFormulario(formData: FormData) {
  return {
    title: String(formData.get('title') ?? ''),
    description: String(formData.get('description') ?? ''),
    system: String(formData.get('system') ?? ''),
    startsAt: String(formData.get('startsAt') ?? ''),
    durationHours: String(formData.get('durationHours') ?? ''),
    seatsTotal: String(formData.get('seatsTotal') ?? ''),
    priceCents: String(formData.get('price') ?? ''),
    // Casillas: `getAll` porque el formulario manda una entrada por marcada y
    // ninguna cuando no hay ninguna.
    languages: formData.getAll('languages').map(String),
    tags: formData.getAll('tags').map(String),
    experience: String(formData.get('experience') ?? ''),
    minAge: String(formData.get('minAge') ?? ''),
    visibility: String(formData.get('visibility') ?? 'PUBLICA'),
    accessPassword: String(formData.get('accessPassword') ?? ''),
  };
}

/**
 * Filtros del listado publico. Todos opcionales.
 *
 * Vienen de la URL, que cualquiera puede escribir a mano, asi que se validan
 * como cualquier otra entrada. Lo que no cuadre se ignora en vez de romper la
 * pagina: un enlace viejo con un filtro que ya no existe tiene que seguir
 * ensenando partidas.
 */
export const filtrosSchema = z.object({
  q: z.string().trim().max(80).optional(),
  system: z.string().trim().max(60).optional(),
  /** Precio maximo por plaza, en euros. */
  maxPrecio: z.coerce.number().nonnegative().optional(),
  /** Solo partidas con plazas libres. */
  soloLibres: z.boolean().optional(),
  /** Solo las que estan a punto de llenarse. */
  ultimasPlazas: z.boolean().optional(),
  /** Cuanta soltura se presupone. */
  experiencia: z.enum(EXPERIENCIAS).optional(),
  /** Una etiqueta del vocabulario. */
  etiqueta: z.string().refine(esEtiqueta, 'Esa etiqueta no está en la lista').optional(),
  /** Ventana de fechas: los proximos siete o treinta dias. */
  cuando: z.enum(['semana', 'mes']).optional(),
});

export type Filtros = z.infer<typeof filtrosSchema>;
