import { describe, expect, it } from 'vitest';

import { loginSchema, registerSchema } from '@/modules/users/schema';

describe('registerSchema', () => {
  const valido = {
    name: 'Ana Soto',
    email: 'ana@ejemplo.com',
    password: 'partida-secreta',
  };

  it('acepta unos datos correctos', () => {
    expect(registerSchema.safeParse(valido).success).toBe(true);
  });

  it('normaliza el email a minusculas', () => {
    // Sin esto, "Ana@x.com" y "ana@x.com" serian dos cuentas distintas pese a
    // la restriccion unica de la base de datos.
    const parsed = registerSchema.parse({ ...valido, email: 'Ana@Ejemplo.COM' });

    expect(parsed.email).toBe('ana@ejemplo.com');
  });

  it('recorta los espacios del nombre y del email', () => {
    const parsed = registerSchema.parse({
      ...valido,
      name: '  Ana Soto  ',
      email: '  ana@ejemplo.com  ',
    });

    expect(parsed.name).toBe('Ana Soto');
    expect(parsed.email).toBe('ana@ejemplo.com');
  });

  it('rechaza un email sin forma de email', () => {
    expect(registerSchema.safeParse({ ...valido, email: 'ana-arroba' }).success).toBe(
      false,
    );
  });

  it('rechaza contrasenas de menos de 10 caracteres', () => {
    expect(registerSchema.safeParse({ ...valido, password: 'corta123' }).success).toBe(
      false,
    );
  });

  it('rechaza contrasenas desmesuradas', () => {
    // Un limite alto evita que alguien fuerce hashes de argon2 carisimos.
    expect(
      registerSchema.safeParse({ ...valido, password: 'a'.repeat(500) }).success,
    ).toBe(false);
  });

  it('rechaza un nombre de un solo caracter', () => {
    expect(registerSchema.safeParse({ ...valido, name: 'A' }).success).toBe(false);
  });
});

describe('loginSchema', () => {
  it('no aplica la longitud minima de contrasena', () => {
    // Una contrasena antigua que ya no cumpliria las reglas actuales debe
    // poder seguir entrando.
    const parsed = loginSchema.safeParse({
      email: 'ana@ejemplo.com',
      password: 'corta',
    });

    expect(parsed.success).toBe(true);
  });

  it('exige que la contrasena no este vacia', () => {
    expect(
      loginSchema.safeParse({ email: 'ana@ejemplo.com', password: '' }).success,
    ).toBe(false);
  });
});
