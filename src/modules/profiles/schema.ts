import { z } from 'zod';

/**
 * Validacion de los perfiles de usuario y de game master.
 */

/** Sistemas y estilos: listas cortas de etiquetas libres. */
const etiquetas = (maximo: number, etiqueta: string) =>
  z
    .array(z.string().trim().min(1).max(40))
    .max(maximo, `Como mucho ${maximo} ${etiqueta}`)
    // Quita vacios y duplicados, ignorando mayusculas.
    .transform((lista) => {
      const vistas = new Set<string>();
      return lista.filter((x) => {
        const clave = x.toLowerCase();
        if (!x || vistas.has(clave)) return false;
        vistas.add(clave);
        return true;
      });
    });

export const perfilJugadorSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Dinos como te llamas')
    .max(60, 'El nombre es demasiado largo'),
  bio: z
    .string()
    .trim()
    .max(500, 'La descripcion no puede pasar de 500 caracteres')
    .optional()
    .transform((v) => v || null),
  preferredSystems: etiquetas(12, 'sistemas'),
  preferredStyles: etiquetas(12, 'estilos'),
});

export const perfilGmSchema = z.object({
  headline: z
    .string()
    .trim()
    .min(10, 'Escribe un titular de al menos 10 caracteres')
    .max(120, 'El titular es demasiado largo'),
  about: z
    .string()
    .trim()
    .max(2000, 'La descripcion no puede pasar de 2000 caracteres')
    .optional()
    .transform((v) => v || null),
  languages: z
    .array(z.string().trim().length(2, 'Usa codigos de dos letras: es, en, fr'))
    .min(1, 'Indica al menos un idioma')
    .max(8, 'Como mucho 8 idiomas')
    .transform((lista) => [...new Set(lista.map((l) => l.toLowerCase()))]),
});

export type PerfilJugadorInput = z.infer<typeof perfilJugadorSchema>;
export type PerfilGmInput = z.infer<typeof perfilGmSchema>;

/**
 * Convierte el texto de un campo separado por comas en una lista de etiquetas.
 * Vive aqui para que el formulario y el servidor lo interpreten igual.
 */
export function listaDesdeTexto(texto: FormDataEntryValue | null): string[] {
  if (typeof texto !== 'string') return [];
  return texto
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);
}
