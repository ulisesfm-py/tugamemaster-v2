import { describe, expect, it } from 'vitest';

import { hashPassword, verifyPassword } from '@/modules/users/password';

describe('hashPassword', () => {
  it('nunca devuelve la contrasena en claro', async () => {
    const hash = await hashPassword('partida-secreta');

    expect(hash).not.toContain('partida-secreta');
    expect(hash.startsWith('$argon2id$')).toBe(true);
  });

  it('produce hashes distintos para la misma contrasena', async () => {
    // Cada hash lleva su propia sal. Si dos fueran iguales, la base de datos
    // revelaria que dos usuarios comparten contrasena.
    const [a, b] = await Promise.all([
      hashPassword('partida-secreta'),
      hashPassword('partida-secreta'),
    ]);

    expect(a).not.toBe(b);
  });
});

describe('verifyPassword', () => {
  it('acepta la contrasena correcta', async () => {
    const hash = await hashPassword('partida-secreta');

    await expect(verifyPassword(hash, 'partida-secreta')).resolves.toBe(true);
  });

  it('rechaza una contrasena incorrecta', async () => {
    const hash = await hashPassword('partida-secreta');

    await expect(verifyPassword(hash, 'partida-secret')).resolves.toBe(false);
  });

  it('distingue mayusculas y minusculas', async () => {
    const hash = await hashPassword('partida-secreta');

    await expect(verifyPassword(hash, 'Partida-Secreta')).resolves.toBe(false);
  });

  it('devuelve false ante un hash corrupto en vez de lanzar', async () => {
    // Si esto lanzara, un hash danado en la base de datos tumbaria el login
    // con un error 500 en lugar de rechazar las credenciales.
    await expect(verifyPassword('esto-no-es-un-hash', 'lo-que-sea')).resolves.toBe(false);
  });

  it('devuelve false ante un hash vacio', async () => {
    await expect(verifyPassword('', 'lo-que-sea')).resolves.toBe(false);
  });
});
