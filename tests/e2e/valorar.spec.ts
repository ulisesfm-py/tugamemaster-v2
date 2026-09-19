import { expect, test } from '@playwright/test';

import { Escenario, USUARIOS } from './apoyo/datos';
import { entrarComo } from './apoyo/sesion';

/**
 * Valorar al game master, que es de donde sale su reputacion.
 */

let escenario: Escenario;

test.beforeEach(() => {
  escenario = new Escenario();
});

test.afterEach(async () => {
  await escenario.limpiar();
});

test('quien jugo valora al game master y la resena sale en su perfil', async ({
  page,
}) => {
  const partida = await escenario.crearPartida('La sesion valorada');
  await escenario.crearReserva(partida.id, USUARIOS.ana, 'PAID');
  await escenario.darPorJugada(partida.id);

  await entrarComo(page, USUARIOS.ana);
  await page.goto('/mis-reservas');

  await page.getByRole('button', { name: /Valorar a Laura Vega/ }).click();

  // Los radios de estrellas estan ocultos a la vista (los pinta la etiqueta),
  // asi que se marcan sin exigir visibilidad.
  await page.locator('input[name="rating"][value="4"]').check({ force: true });
  await page
    .getByRole('textbox')
    .fill('Muy buen ritmo y mucha atención a los personajes callados.');

  await page.getByRole('button', { name: 'Publicar valoración' }).click();

  // Igual que al reservar: el mensaje de la accion no sobrevive a la
  // revalidacion, asi que se comprueba la resena ya publicada. Se acota a la
  // fila de esta partida: la jugadora tiene otras valoradas del seed.
  const fila = page.getByRole('listitem').filter({ hasText: partida.title });
  await expect(fila.getByText('Le pusiste 4 de 5')).toBeVisible();
  await expect(
    fila.getByRole('button', { name: 'Corregir mi valoración' }),
  ).toBeVisible();

  // Y aparece en el perfil publico del game master.
  await page.goto('/gm/laura-vega');
  await expect(
    page.getByText('Muy buen ritmo y mucha atención a los personajes callados.'),
  ).toBeVisible();
});

test('una partida que aun no se ha jugado no se puede valorar', async ({ page }) => {
  const partida = await escenario.crearPartida('La que no se ha jugado');
  await escenario.crearReserva(partida.id, USUARIOS.ana, 'PAID');

  await entrarComo(page, USUARIOS.ana);
  await page.goto('/mis-reservas');

  await expect(page.getByRole('button', { name: /Valorar a/ })).toHaveCount(0);
});
