import { expect, test } from '@playwright/test';

import { Escenario } from './apoyo/datos';

/**
 * Las paginas de sistema.
 *
 * Lo que hay que comprobar de punta a punta es el viaje de ida y vuelta: el
 * nombre del sistema lo escribe a mano cada game master, se convierte en una
 * direccion, y esa direccion tiene que volver a encontrar sus partidas. Si la
 * conversion cambia, la pagina se queda vacia sin que nada falle.
 */

let escenario: Escenario;

test.beforeEach(() => {
  escenario = new Escenario();
});

test.afterEach(async () => {
  await escenario.limpiar();
});

test('una partida aparece en la página de su sistema', async ({ page }) => {
  const partida = await escenario.crearPartida('La del sistema');

  // El fixture las crea con «D&D 5e», que lleva un ampersand y un espacio: dos
  // caracteres que hay que convertir para que quepan en una URL.
  await page.goto('/sistemas/d-d-5e');

  await expect(page.getByRole('heading', { name: 'Partidas de D&D 5e' })).toBeVisible();
  await expect(page.getByRole('link', { name: new RegExp(partida.title) })).toBeVisible();
});

test('se llega desde el índice y desde la propia partida', async ({ page }) => {
  const partida = await escenario.crearPartida('La del índice');

  await page.goto('/sistemas');
  await page.getByRole('link', { name: /D&D 5e/ }).click();
  await page.waitForURL((url) => url.pathname === '/sistemas/d-d-5e');

  await page.goto(`/partidas/${partida.slug}`);
  await page.getByRole('link', { name: 'D&D 5e', exact: true }).click();
  await page.waitForURL((url) => url.pathname === '/sistemas/d-d-5e');
});

test('un sistema que nadie dirige da 404, no una página en blanco', async ({ page }) => {
  const respuesta = await page.goto('/sistemas/rolemaster');

  expect(respuesta?.status()).toBe(404);
});
