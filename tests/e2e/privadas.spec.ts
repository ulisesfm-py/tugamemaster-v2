import { expect, test } from '@playwright/test';

import { Escenario, USUARIOS } from './apoyo/datos';
import { consultar, unaFila } from './apoyo/db';
import { entrarComo } from './apoyo/sesion';

/**
 * Partidas privadas: salen en el listado, pero para reservar hay que saber la
 * contrasena que reparte el game master.
 */

let escenario: Escenario;

test.beforeEach(() => {
  escenario = new Escenario();
});

test.afterEach(async () => {
  await escenario.limpiar();
  // La que crea el GM desde el formulario no la ha apuntado el escenario.
  await consultar('DELETE FROM "Game" WHERE "title" LIKE $1', [`%${escenario.marca}%`]);
});

test('una partida privada sale en el listado, con su etiqueta', async ({ page }) => {
  const partida = await escenario.crearPartida('La logia', { contrasena: '12345678' });

  await page.goto('/partidas');

  const tarjeta = page.getByRole('link', { name: new RegExp(partida.title) });
  await expect(tarjeta).toBeVisible();
  await expect(tarjeta).toContainText('Privada');
});

test('sin la contraseña no se reserva; con ella, sí', async ({ page }) => {
  const partida = await escenario.crearPartida('El cónclave', { contrasena: '12345678' });

  await entrarComo(page, USUARIOS.ana);
  await page.goto(`/partidas/${partida.slug}`);

  await expect(
    page
      .getByRole('main')
      .getByTitle('Para reservar hace falta la contraseña que da el game master'),
  ).toBeVisible();

  const campo = page.getByLabel('Contraseña de la partida');
  const reservar = page.getByRole('button', { name: 'Reservar plaza' });

  await reservar.click();
  await expect(page.getByText(/escribe la contraseña que te ha dado/)).toBeVisible();

  await campo.fill('87654321');
  await reservar.click();
  await expect(page.getByText('Esa no es la contraseña de esta partida')).toBeVisible();
  // Lo escrito se queda: equivocarse en una letra no obliga a empezar de cero.
  await expect(campo).toHaveValue('87654321');

  await campo.fill('12345678');
  await reservar.click();
  await expect(page.getByText('Tienes una plaza reservada.')).toBeVisible();
});

test('la página pública nunca lleva la contraseña', async ({ page }) => {
  const partida = await escenario.crearPartida('El sello', {
    contrasena: 'clave-que-no-debe-salir',
  });

  await entrarComo(page, USUARIOS.ana);
  const respuesta = await page.goto(`/partidas/${partida.slug}`);

  expect(await respuesta?.text()).not.toContain('clave-que-no-debe-salir');
});

test('el game master crea una partida privada y ve su contraseña', async ({ page }) => {
  const titulo = `La cofradía ${escenario.marca}`;
  const dentroDeDiezDias = new Date(Date.now() + 10 * 86_400_000);
  const fecha = `${dentroDeDiezDias.toISOString().slice(0, 10)}T19:00`;

  await entrarComo(page, USUARIOS.gm);
  await page.goto('/cuenta/partidas/nueva');

  await page.getByLabel('Título').fill(titulo);
  await page.getByLabel('Sistema de juego').fill('Vaesen');
  await page
    .getByLabel('Descripción')
    .fill('Una mesa cerrada para el grupo de los jueves, que ya se conoce de sobra.');
  await page.getByLabel('Empieza').fill(fecha);
  await page.getByLabel('Precio por plaza (€)').fill('15');

  // Publica por defecto: el campo de la contrasena no se ve hasta elegir
  // privada.
  await expect(page.getByLabel('Contraseña para reservar')).toBeHidden();
  await page.getByRole('radio', { name: /Privada/ }).check({ force: true });
  await page.getByLabel('Contraseña para reservar').fill('jueves2026');

  await page.getByRole('button', { name: 'Crear borrador' }).click();

  await page.waitForURL(/\/cuenta\/partidas\/[^/]+$/);
  await expect(page.getByRole('heading', { name: 'Partida privada' })).toBeVisible();
  await expect(page.getByText('jueves2026', { exact: true })).toBeVisible();

  const guardada = await unaFila<{ visibility: string; accessPassword: string }>(
    'SELECT "visibility"::text, "accessPassword" FROM "Game" WHERE "title" = $1',
    [titulo],
  );
  expect(guardada).toEqual({ visibility: 'PRIVADA', accessPassword: 'jueves2026' });
});
