import { z } from 'zod';

import { LONGITUD_MINIMA_PASSWORD } from './password';

/**
 * Esquemas de validacion del modulo de usuarios.
 *
 * Se usan tanto en el formulario como en el servidor. El servidor valida
 * siempre, aunque el cliente ya lo haya hecho: el formulario es una comodidad,
 * no una barrera.
 */

export const emailSchema = z
  .string()
  .trim()
  .min(1, 'El email es obligatorio')
  .email('Ese email no parece válido')
  .toLowerCase();

export const passwordSchema = z
  .string()
  .min(
    LONGITUD_MINIMA_PASSWORD,
    `La contraseña debe tener al menos ${LONGITUD_MINIMA_PASSWORD} caracteres`,
  )
  .max(200, 'La contraseña es demasiado larga');

export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Dinos cómo te llamas')
    .max(60, 'El nombre es demasiado largo'),
  email: emailSchema,
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: emailSchema,
  // En el login no se aplican las reglas de longitud: una contrasena antigua
  // que ya no cumpliria las reglas actuales debe poder seguir entrando.
  password: z.string().min(1, 'Escribe tu contraseña'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
