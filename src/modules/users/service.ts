import 'server-only';

import { db } from '@/lib/db';

import { hashPassword, verifyPassword } from './password';
import { registerSchema, type RegisterInput } from './schema';
import { slugDisponible } from './slug';

/**
 * Reglas de negocio de usuarios. Las rutas y los formularios llaman aqui;
 * nunca hablan con Prisma directamente.
 */

export type ResultadoRegistro =
  | { ok: true; userId: string }
  | { ok: false; error: 'EMAIL_EN_USO' | 'DATOS_INVALIDOS'; mensaje: string };

/**
 * Da de alta un usuario con email y contrasena.
 *
 * El email se guarda siempre en minusculas (lo normaliza el esquema) para que
 * la unicidad sea real: sin eso, "Ana@x.com" y "ana@x.com" serian dos cuentas.
 */
export async function registrarUsuario(input: RegisterInput): Promise<ResultadoRegistro> {
  const parsed = registerSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      error: 'DATOS_INVALIDOS',
      mensaje: parsed.error.issues[0]?.message ?? 'Revisa los datos',
    };
  }

  const { name, email, password } = parsed.data;

  const yaExiste = await db.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (yaExiste) {
    return {
      ok: false,
      error: 'EMAIL_EN_USO',
      mensaje: 'Ya hay una cuenta con ese email',
    };
  }

  const slug = await slugDisponible(name, async (candidato) => {
    const ocupado = await db.user.findUnique({
      where: { slug: candidato },
      select: { id: true },
    });
    return ocupado !== null;
  });

  const passwordHash = await hashPassword(password);

  try {
    const user = await db.user.create({
      data: { name, email, slug, passwordHash },
      select: { id: true },
    });

    return { ok: true, userId: user.id };
  } catch {
    // Carrera: otro registro simultaneo se quedo con el email o el slug entre
    // nuestra comprobacion y el insert. La restriccion unica de la base de
    // datos es la autoridad final.
    return {
      ok: false,
      error: 'EMAIL_EN_USO',
      mensaje: 'Ya hay una cuenta con ese email',
    };
  }
}

export type UsuarioAutenticado = {
  id: string;
  email: string;
  name: string;
  slug: string;
  isAdmin: boolean;
  avatarUrl: string | null;
};

/**
 * Comprueba unas credenciales. Devuelve null si no son validas.
 *
 * No distingue entre "no existe ese email" y "la contrasena es incorrecta":
 * hacerlo permitiria averiguar que cuentas existen en la plataforma.
 */
export async function verificarCredenciales(
  email: string,
  password: string,
): Promise<UsuarioAutenticado | null> {
  const user = await db.user.findUnique({
    where: { email: email.trim().toLowerCase() },
    select: {
      id: true,
      email: true,
      name: true,
      slug: true,
      isAdmin: true,
      avatarUrl: true,
      passwordHash: true,
    },
  });

  // Cuenta creada solo con Discord: no tiene contrasena que comprobar.
  if (!user?.passwordHash) return null;

  const valida = await verifyPassword(user.passwordHash, password);
  if (!valida) return null;

  const { passwordHash: _passwordHash, ...datos } = user;
  return datos;
}
