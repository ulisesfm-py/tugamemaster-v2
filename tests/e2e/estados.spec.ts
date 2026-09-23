import { expect, test } from '@playwright/test';

/**
 * Las pantallas de cuando algo no existe.
 *
 * Lo que se comprueba aqui no es solo que salga la pagina bonita, sino que el
 * servidor conteste **404 de verdad**. Es facil romperlo sin enterarse: basta
 * un `loading.tsx` en el segmento para que la respuesta pase a streaming, y
 * entonces el 200 se manda antes de que la pagina llegue a llamar a
 * `notFound()`. Paso justo eso, y una partida inexistente contestaba 200.
 */

const INEXISTENTES = [
  '/no-existe-esta-pagina',
  '/partidas/no-existe',
  '/gm/no-existe',
  '/campanas/no-existe',
  '/u/no-existe',
  '/blog/no-existe',
];

test('lo que no existe contesta 404, no 200 con cara de 404', async ({ page }) => {
  for (const ruta of INEXISTENTES) {
    const respuesta = await page.goto(ruta);
    expect(respuesta?.status(), `${ruta} deberia dar 404`).toBe(404);
  }
});

test('la página de no encontrado ofrece una salida', async ({ page }) => {
  await page.goto('/partidas/no-existe');

  await expect(page.getByRole('heading', { name: 'Aquí no hay nada' })).toBeVisible();

  // Con cabecera y pie: quien aterriza aqui necesita sobre todo una salida.
  await expect(page.getByRole('banner')).toBeVisible();
  await expect(page.getByRole('contentinfo')).toBeVisible();

  await page.getByRole('link', { name: 'Ver mesas abiertas' }).click();
  await page.waitForURL((url) => url.pathname === '/partidas');
});
