import { expect, test } from '@playwright/test';

import { consultar, unaFila } from './apoyo/db';
import { USUARIOS } from './apoyo/datos';
import { entrarComo } from './apoyo/sesion';

/**
 * Guardar el perfil.
 *
 * No tenia cobertura ninguna, y es de las pocas pantallas donde un `name`
 * equivocado en un campo no rompe nada a la vista: el formulario se envia, la
 * accion dice «guardado» y el dato se pierde por el camino.
 *
 * Esta prueba toca a un usuario del seed en vez de fabricarse uno, asi que
 * devuelve lo que habia al terminar.
 */

const MARCA = `Probando el perfil ${Date.now()}`;

let original: { bio: string | null; preferredStyles: string[] };

test.beforeEach(async () => {
  original = await unaFila<{ bio: string | null; preferredStyles: string[] }>(
    'SELECT "bio", "preferredStyles" FROM "User" WHERE "email" = $1',
    [USUARIOS.ana],
  );
});

test.afterEach(async () => {
  await consultar(
    'UPDATE "User" SET "bio" = $1, "preferredStyles" = $2 WHERE "email" = $3',
    [original.bio, original.preferredStyles, USUARIOS.ana],
  );
});

test('lo que escribes en tu perfil se guarda y sale en tu página pública', async ({
  page,
}) => {
  await entrarComo(page, USUARIOS.ana);
  await page.goto('/cuenta');

  await page.getByLabel('Sobre ti', { exact: false }).fill(MARCA);
  await page
    .getByLabel('Estilo de juego que prefieres', { exact: false })
    .fill('narrativo, investigación');

  await page.getByRole('button', { name: 'Guardar cambios' }).click();
  await expect(page.getByText('Guardado.')).toBeVisible();

  // Donde de verdad cuenta: en el perfil que ve el resto.
  await page.goto('/u/ana-soto');
  await expect(page.getByText(MARCA)).toBeVisible();
  await expect(page.getByText('narrativo')).toBeVisible();
  await expect(page.getByText('investigación')).toBeVisible();
});
