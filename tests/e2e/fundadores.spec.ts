import { expect, test } from '@playwright/test';

import { Escenario, USUARIOS } from './apoyo/datos';
import { consultar, unaFila } from './apoyo/db';
import { entrarComo } from './apoyo/sesion';

/**
 * Los game masters fundadores: quien los nombra y que comision se llevan.
 *
 * Laura es fundadora en el seed y Marco no. La prueba que cambia el plan de
 * Marco se lo devuelve al terminar, pase lo que pase: un plan cambiado haria
 * fallar a las demas por motivos que no tienen nada que ver con ellas.
 */

let escenario: Escenario;

test.beforeEach(() => {
  escenario = new Escenario();
});

test.afterEach(async () => {
  await escenario.limpiar();
  await consultar(
    `UPDATE "GmProfile" SET "plan" = 'ESTANDAR'
     WHERE "userId" = (SELECT "id" FROM "User" WHERE "email" = $1)`,
    [USUARIOS.otroGm],
  );
});

test('un administrador nombra fundador a un game master', async ({ page }) => {
  const marco = await escenario.usuario(USUARIOS.otroGm);

  await entrarComo(page, USUARIOS.admin);
  await page.goto('/admin/game-masters');

  const fila = page.getByRole('listitem').filter({ hasText: USUARIOS.otroGm });
  await fila.getByRole('button', { name: 'Hacer fundador' }).click();

  // Se espera al boton contrario, que solo aparece cuando la pagina se ha
  // vuelto a pintar con el plan ya guardado.
  await expect(fila.getByRole('button', { name: 'Quitar fundador' })).toBeVisible();

  // Y se ve fuera de administracion, que es donde importa.
  await page.goto(`/u/${marco.slug}`);
  await expect(
    page.getByRole('heading', { level: 1 }).getByText('Fundador'),
  ).toBeVisible();
});

test('quien no es administrador no puede nombrar fundadores', async ({ page }) => {
  await entrarComo(page, USUARIOS.otroGm);

  const respuesta = await page.goto('/admin/game-masters');
  expect(respuesta?.status()).toBe(404);
});

test('cada reserva guarda la comisión del plan de su game master', async ({ page }) => {
  const deLaura = await escenario.crearPartida('La biblioteca', { gm: USUARIOS.gm });
  const deMarco = await escenario.crearPartida('El sótano', { gm: USUARIOS.otroGm });

  await entrarComo(page, USUARIOS.ana);

  for (const partida of [deLaura, deMarco]) {
    await page.goto(`/partidas/${partida.slug}`);
    await page.getByRole('button', { name: 'Reservar plaza' }).click();
    await expect(page.getByText('Tienes una plaza reservada.')).toBeVisible();
  }

  const comisionDe = async (gameId: string) =>
    (
      await unaFila<{ commissionBps: number }>(
        'SELECT "commissionBps" FROM "Booking" WHERE "gameId" = $1',
        [gameId],
      )
    ).commissionBps;

  // Laura es fundadora: 5%. Marco no: el 10% general.
  expect(await comisionDe(deLaura.id)).toBe(500);
  expect(await comisionDe(deMarco.id)).toBe(1000);
});
