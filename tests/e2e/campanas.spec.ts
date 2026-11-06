import { expect, test } from '@playwright/test';

import { Escenario, USUARIOS } from './apoyo/datos';
import { consultar, unaFila } from './apoyo/db';
import { entrarComo } from './apoyo/sesion';

/**
 * Continuar una partida ya jugada, que es como nace una campana.
 *
 * Esta prueba existe porque no habia ninguna, y durante semanas no se pudo
 * crear una continuacion: la accion leia el formulario por su cuenta y se
 * quedo sin los campos que la ficha gano despues, asi que la validacion la
 * rechazaba siempre.
 */

let escenario: Escenario;

test.beforeEach(() => {
  escenario = new Escenario();
});

test.afterEach(async () => {
  const marca = `%${escenario.marca}%`;

  // Primero la continuacion, que cuelga de la partida del escenario.
  await consultar(
    'DELETE FROM "Game" WHERE "title" LIKE $1 AND "previousGameId" IS NOT NULL',
    [marca],
  );
  await escenario.limpiar();
  await consultar('DELETE FROM "Campaign" WHERE "title" LIKE $1', [marca]);
});

test('el game master continúa una partida jugada y nace la campaña', async ({ page }) => {
  const anterior = await escenario.crearPartida('La primera noche', {
    empiezaEnHoras: -48,
    estado: 'COMPLETED',
  });

  await entrarComo(page, USUARIOS.gm);
  await page.goto(`/cuenta/partidas/${anterior.id}/continuacion`);

  // El formulario llega relleno con la ficha de la anterior: basta con enviarlo.
  await page.getByRole('button', { name: 'Crear la sesión' }).click();

  await page.waitForURL((url) => {
    const ruta = url.pathname;
    return ruta.startsWith('/cuenta/partidas/') && !ruta.includes(anterior.id);
  });

  const nueva = await unaFila<{ sessionNumber: number; campaignId: string | null }>(
    'SELECT "sessionNumber", "campaignId" FROM "Game" WHERE "previousGameId" = $1',
    [anterior.id],
  );

  expect(nueva.sessionNumber).toBe(2);
  expect(nueva.campaignId).not.toBeNull();
});
