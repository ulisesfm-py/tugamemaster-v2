import { expect, type Page } from '@playwright/test';

import { PASSWORD } from './datos';

/**
 * Entra en la aplicacion con un usuario de desarrollo.
 *
 * Se usa el formulario de verdad en vez de fabricar una cookie de sesion a
 * mano: el login es parte del camino critico y conviene que se rompa aqui si
 * se rompe de verdad.
 */
export async function entrarComo(page: Page, email: string): Promise<void> {
  await page.goto('/login');

  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Contraseña').fill(PASSWORD);
  await page.getByRole('button', { name: 'Entrar' }).click();

  // El login redirige a la cuenta: hasta que no llega, la sesion no esta puesta.
  await expect(page).toHaveURL(/\/dashboard|\/cuenta/);
}

/** Cierra la sesion para poder entrar con otro usuario en la misma prueba. */
export async function salir(page: Page): Promise<void> {
  await page.goto('/api/auth/signout');
  await page.getByRole('button', { name: /sign out/i }).click();
  await expect(page).toHaveURL(/\/login|\/$/);
}
