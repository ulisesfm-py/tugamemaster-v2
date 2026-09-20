import { expect, test } from '@playwright/test';

import { USUARIOS } from './apoyo/datos';
import { entrarComo } from './apoyo/sesion';

/**
 * El area de administracion.
 *
 * Lo que de verdad importa comprobar aqui es quien NO entra: desde /admin se
 * aprueban devoluciones y se mueve dinero, asi que la puerta se prueba antes
 * que lo que hay detras.
 */

test('quien no es administrador no llega al área de administración', async ({ page }) => {
  await entrarComo(page, USUARIOS.ana);

  for (const ruta of ['/admin', '/admin/incidencias', '/admin/blog']) {
    const respuesta = await page.goto(ruta);
    expect(respuesta?.status(), `${ruta} deberia estar cerrada`).toBe(404);
  }
});

test('un administrador ve el índice y llega a las dos pantallas', async ({ page }) => {
  await entrarComo(page, USUARIOS.admin);
  await page.goto('/admin');

  await expect(page.getByRole('heading', { name: 'Administración' })).toBeVisible();

  // El dinero que debemos, que hasta ahora se calculaba y no lo veia nadie.
  await expect(page.getByText('Saldo de los usuarios')).toBeVisible();

  // Dentro del <main>: la cabecera y el pie tienen tambien un enlace «Blog»,
  // y el de arriba lleva al blog publico, no al de administracion.
  const atajos = page.getByRole('main');

  await atajos.getByRole('link', { name: /Incidencias/ }).click();
  await expect(page.getByRole('heading', { name: 'Incidencias' })).toBeVisible();

  await page.goto('/admin');
  await atajos.getByRole('link', { name: /Blog/ }).click();
  await expect(page.getByRole('heading', { name: 'Artículos' })).toBeVisible();
});
