import { expect, test, type Page } from '@playwright/test';

import { Escenario, USUARIOS } from './apoyo/datos';
import { consultar, unaFila } from './apoyo/db';
import { entrarComo } from './apoyo/sesion';

/**
 * El codigo de invitacion de los game masters.
 *
 * Lo tiene cualquier GM, sea o no fundador: por los jugadores que se registran
 * con el no paga comision en sus mesas.
 *
 * Lo que se prueba es que el emparejamiento queda en la cuenta al crearla, y
 * no en el navegador: por eso hay una prueba que escribe el codigo a mano,
 * sin haber pasado nunca por el enlace.
 *
 * Laura es fundadora en el seed y tiene codigo. Lo que estas pruebas le
 * cambian —la caducidad— y lo que le cambian a Marco —el plan y su codigo— se
 * deja como estaba al terminar, pase lo que pase.
 */

let escenario: Escenario;
let laura: { id: string; inviteCode: string; inviteCodeExpiresAt: Date };
let marco: { id: string; inviteCode: string | null; inviteCodeExpiresAt: Date | null };

/** Contrasena de las cuentas que se crean aqui. Cumple la longitud minima. */
const CLAVE = 'una-clave-de-prueba';

test.beforeEach(async () => {
  escenario = new Escenario();
  laura = await unaFila(
    `SELECT g."id", g."inviteCode", g."inviteCodeExpiresAt"
     FROM "GmProfile" g JOIN "User" u ON u."id" = g."userId"
     WHERE u."email" = $1`,
    [USUARIOS.gm],
  );
  marco = await unaFila(
    `SELECT g."id", g."inviteCode", g."inviteCodeExpiresAt"
     FROM "GmProfile" g JOIN "User" u ON u."id" = g."userId"
     WHERE u."email" = $1`,
    [USUARIOS.otroGm],
  );
});

test.afterEach(async () => {
  // Primero las reservas, que apuntan a los usuarios nuevos.
  await escenario.limpiar();
  await consultar('DELETE FROM "User" WHERE "email" LIKE $1', [`${escenario.marca}%`]);
  await consultar('UPDATE "GmProfile" SET "inviteCodeExpiresAt" = $1 WHERE "id" = $2', [
    laura.inviteCodeExpiresAt,
    laura.id,
  ]);
  await consultar(
    `UPDATE "GmProfile"
     SET "plan" = 'ESTANDAR', "inviteCode" = $1, "inviteCodeExpiresAt" = $2
     WHERE "id" = $3`,
    [marco.inviteCode, marco.inviteCodeExpiresAt, marco.id],
  );
});

/** Rellena el alta. El codigo, si lo hay, ya esta puesto o se escribe aparte. */
async function rellenarAlta(page: Page, email: string) {
  await page.getByLabel('Nombre').fill('Jugadora invitada');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Contraseña').fill(CLAVE);
  await page.getByRole('button', { name: 'Crear cuenta' }).click();
}

async function invitadoPor(email: string): Promise<string | null> {
  const fila = await unaFila<{ referredByGmId: string | null }>(
    'SELECT "referredByGmId" FROM "User" WHERE "email" = $1',
    [email],
  );
  return fila.referredByGmId;
}

test('el enlace lleva a crear la cuenta con el código puesto, y la empareja', async ({
  page,
}) => {
  const email = `${escenario.marca}-enlace@tugamemaster.test`;

  // En minusculas, como lo escribiria alguien que lo copia de una bio.
  await page.goto(`/r/${laura.inviteCode.toLowerCase()}`);

  await expect(page).toHaveURL(/\/registro\?codigo=/);
  await expect(page.getByText('Te invita')).toContainText('Laura');
  await expect(page.getByLabel(/Código de tu game master/)).toHaveValue(
    `${laura.inviteCode.slice(0, 4)}-${laura.inviteCode.slice(4)}`,
  );

  await rellenarAlta(page, email);
  await expect(page).toHaveURL(/\/dashboard/);

  expect(await invitadoPor(email)).toBe(laura.id);
});

test('el código escrito a mano empareja igual, sin haber pasado por el enlace', async ({
  page,
}) => {
  const email = `${escenario.marca}-mano@tugamemaster.test`;

  await page.goto('/registro');
  await page.getByLabel(/Código de tu game master/).fill(laura.inviteCode);
  await rellenarAlta(page, email);
  await expect(page).toHaveURL(/\/dashboard/);

  expect(await invitadoPor(email)).toBe(laura.id);
});

test('sin código la cuenta se crea sin emparejar', async ({ page }) => {
  const email = `${escenario.marca}-solo@tugamemaster.test`;

  await page.goto('/registro');
  await rellenarAlta(page, email);
  await expect(page).toHaveURL(/\/dashboard/);

  expect(await invitadoPor(email)).toBeNull();
});

test('un código caducado no deja crear la cuenta con él, y se dice', async ({ page }) => {
  const email = `${escenario.marca}-tarde@tugamemaster.test`;

  await consultar(
    `UPDATE "GmProfile" SET "inviteCodeExpiresAt" = now() - interval '1 day'
     WHERE "id" = $1`,
    [laura.id],
  );

  await page.goto(`/r/${laura.inviteCode}`);

  // Se avisa al llegar, antes de que se escriba nada.
  await expect(page.getByRole('main')).toContainText('ha caducado');

  await rellenarAlta(page, email);

  await expect(page.getByRole('main').getByRole('alert').last()).toContainText(
    'ha caducado',
  );
  // Lo escrito se conserva, incluido el codigo, para poder borrarlo y seguir.
  await expect(page.getByLabel('Email')).toHaveValue(email);

  const creadas = await consultar('SELECT 1 FROM "User" WHERE "email" = $1', [email]);
  expect(creadas).toHaveLength(0);
});

test('con su game master no paga comisión; con otro fundador, el 3%', async ({
  page,
}) => {
  const email = `${escenario.marca}-reserva@tugamemaster.test`;

  // Marco pasa a fundador solo durante esta prueba.
  await consultar(
    `UPDATE "GmProfile" SET "plan" = 'FUNDADOR'
     WHERE "userId" = (SELECT "id" FROM "User" WHERE "email" = $1)`,
    [USUARIOS.otroGm],
  );

  const deLaura = await escenario.crearPartida('La cripta de Laura', { gm: USUARIOS.gm });
  const deMarco = await escenario.crearPartida('La mazmorra de Marco', {
    gm: USUARIOS.otroGm,
  });

  await page.goto(`/r/${laura.inviteCode}`);
  await rellenarAlta(page, email);
  await expect(page).toHaveURL(/\/dashboard/);

  for (const partida of [deLaura, deMarco]) {
    await page.goto(`/partidas/${partida.slug}`);
    await page.getByRole('button', { name: 'Reservar plaza' }).click();
    await expect(page.getByText('Tienes una plaza reservada.')).toBeVisible();
  }

  const reservaDe = (gameId: string) =>
    unaFila<{ commissionBps: number; origin: string }>(
      'SELECT "commissionBps", "origin"::text FROM "Booking" WHERE "gameId" = $1',
      [gameId],
    );

  expect(await reservaDe(deLaura.id)).toEqual({ commissionBps: 0, origin: 'ENLACE_GM' });
  expect(await reservaDe(deMarco.id)).toEqual({
    commissionBps: 300,
    origin: 'PLATAFORMA',
  });
});

test('un game master que no es fundador crea su enlace, y sus jugadores no le cuestan comisión', async ({
  page,
}) => {
  const email = `${escenario.marca}-estandar@tugamemaster.test`;

  // Marco es estandar en el seed. Se parte de que no tiene codigo.
  await consultar(
    'UPDATE "GmProfile" SET "inviteCode" = NULL, "inviteCodeExpiresAt" = NULL WHERE "id" = $1',
    [marco.id],
  );

  await entrarComo(page, USUARIOS.otroGm);
  await page.goto('/dashboard');

  const tarjeta = page.getByRole('region', { name: 'Tu enlace de invitación' });
  await tarjeta.getByRole('button', { name: 'Crear mi enlace' }).click();
  await expect(tarjeta.getByRole('button', { name: 'Copiar enlace' })).toBeVisible();

  const { inviteCode } = await unaFila<{ inviteCode: string }>(
    'SELECT "inviteCode" FROM "GmProfile" WHERE "id" = $1',
    [marco.id],
  );
  await expect(tarjeta).toContainText(`/r/${inviteCode}`);

  const deMarco = await escenario.crearPartida('La torre de Marco', {
    gm: USUARIOS.otroGm,
  });

  await page.context().clearCookies();
  await page.goto(`/r/${inviteCode}`);
  await rellenarAlta(page, email);
  await expect(page).toHaveURL(/\/dashboard/);
  expect(await invitadoPor(email)).toBe(marco.id);

  await page.goto(`/partidas/${deMarco.slug}`);
  await page.getByRole('button', { name: 'Reservar plaza' }).click();
  await expect(page.getByText('Tienes una plaza reservada.')).toBeVisible();

  expect(
    await unaFila<{ commissionBps: number; origin: string }>(
      'SELECT "commissionBps", "origin"::text FROM "Booking" WHERE "gameId" = $1',
      [deMarco.id],
    ),
  ).toEqual({ commissionBps: 0, origin: 'ENLACE_GM' });
});

test('con sesión iniciada, el enlace explica que solo sirve para cuentas nuevas', async ({
  page,
}) => {
  await entrarComo(page, USUARIOS.ana);
  await page.goto(`/r/${laura.inviteCode}`);

  await expect(
    page.getByRole('heading', { level: 1, name: 'Ya tienes una cuenta' }),
  ).toBeVisible();

  // Y no la ha emparejado de paso.
  expect(await invitadoPor(USUARIOS.ana)).toBeNull();
});

test('el game master ve su código y quién se ha registrado con él', async ({ page }) => {
  const email = `${escenario.marca}-panel@tugamemaster.test`;

  await page.goto(`/r/${laura.inviteCode}`);
  await rellenarAlta(page, email);
  await expect(page).toHaveURL(/\/dashboard/);

  await page.context().clearCookies();
  await entrarComo(page, USUARIOS.gm);
  await page.goto('/cuenta/cobros');

  const panel = page.getByRole('region', { name: 'Tu enlace de invitación' });
  await expect(panel).toContainText(
    `${laura.inviteCode.slice(0, 4)}-${laura.inviteCode.slice(4)}`,
  );
  await expect(panel).toContainText(`/r/${laura.inviteCode}`);
  await expect(panel.getByRole('link', { name: 'Jugadora invitada' })).toBeVisible();
});
