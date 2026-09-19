import { expect, test } from '@playwright/test';

import { Escenario, USUARIOS } from './apoyo/datos';
import { entrarComo } from './apoyo/sesion';

/**
 * El camino critico: encontrar una partida, reservar plaza y verla confirmada.
 *
 * Se usan partidas gratuitas a proposito. El tramo de la tarjeta vive en
 * Stripe Checkout, que es una pantalla suya y exige la CLI reenviando
 * webhooks; esa parte va aparte. Todo lo demas —aforo, sesion, estado de la
 * reserva, lo que ve el jugador— es identico con precio o sin el.
 */

let escenario: Escenario;

test.beforeEach(() => {
  escenario = new Escenario();
});

test.afterEach(async () => {
  await escenario.limpiar();
});

test('una partida publicada aparece en el portal y se puede abrir', async ({ page }) => {
  const partida = await escenario.crearPartida('La cripta');

  await page.goto('/partidas');
  await expect(page.getByRole('link', { name: partida.title })).toBeVisible();

  await page.getByRole('link', { name: partida.title }).click();

  await expect(page.getByRole('heading', { name: partida.title })).toBeVisible();
  await expect(page.getByText('4 de 4 plazas libres')).toBeVisible();
});

test('sin sesion no se puede reservar: se invita a entrar', async ({ page }) => {
  const partida = await escenario.crearPartida('El pozo');

  await page.goto(`/partidas/${partida.slug}`);

  await expect(
    page.getByRole('link', { name: 'Inicia sesión para reservar' }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Reservar plaza' })).toHaveCount(0);
});

test('un jugador reserva su plaza y la ve en Mis reservas', async ({ page }) => {
  const partida = await escenario.crearPartida('La torre');

  await entrarComo(page, USUARIOS.ana);
  await page.goto(`/partidas/${partida.slug}`);

  await page.getByRole('button', { name: 'Reservar plaza' }).click();

  // Partida gratuita: no pasa por Stripe y queda confirmada en el acto. Se
  // comprueba el estado en que queda la pagina, no el mensaje de la accion:
  // al revalidar, el componente que lo mostraba lo sustituye el de liberar.
  await expect(page.getByText('Tienes una plaza reservada.')).toBeVisible();
  await expect(page.getByText('3 de 4 plazas libres')).toBeVisible();

  await page.goto('/mis-reservas');
  await expect(page.getByRole('link', { name: partida.title })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Liberar mi plaza' })).toBeVisible();
});

test('el aforo se respeta: sin plazas no se puede reservar', async ({ page }) => {
  const partida = await escenario.crearPartida('La mesa llena', { plazas: 1 });
  await escenario.crearReserva(partida.id, USUARIOS.bruno, 'PAID');

  await entrarComo(page, USUARIOS.ana);
  await page.goto(`/partidas/${partida.slug}`);

  await expect(page.getByText('Sin plazas libres')).toBeVisible();
  await expect(page.getByText(/No quedan plazas/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Reservar plaza' })).toHaveCount(0);
});

test('el game master no puede reservar en su propia partida', async ({ page }) => {
  const partida = await escenario.crearPartida('La mia');

  await entrarComo(page, USUARIOS.gm);
  await page.goto(`/partidas/${partida.slug}`);

  await expect(page.getByText('Es tu partida.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Reservar plaza' })).toHaveCount(0);
});

test('un jugador libera su plaza y deja de ocuparla', async ({ page }) => {
  const partida = await escenario.crearPartida('La que suelto');
  await escenario.crearReserva(partida.id, USUARIOS.ana, 'PAID');

  await entrarComo(page, USUARIOS.ana);
  await page.goto('/mis-reservas');

  await page.getByRole('button', { name: 'Liberar mi plaza' }).click();

  // Sale de "Proximas" y baja al historial como cancelada.
  await expect(page.getByRole('heading', { name: 'Historial' })).toBeVisible();
  await expect(page.getByText('Cancelada')).toBeVisible();

  // Y la plaza vuelve al mercado.
  await page.goto(`/partidas/${partida.slug}`);
  await expect(page.getByText('4 de 4 plazas libres')).toBeVisible();
});
