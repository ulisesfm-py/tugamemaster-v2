import { expect, test } from '@playwright/test';

import { Escenario, USUARIOS } from './apoyo/datos';
import { entrarComo } from './apoyo/sesion';

/**
 * El camino del dinero cuando cancela el game master.
 *
 * Es el caso que mas importa comprobar de punta a punta: el jugador no ha
 * hecho nada mal y tiene que recuperar el 100% sin que importe cuanto falte
 * para la partida.
 */

let escenario: Escenario;

test.beforeEach(() => {
  escenario = new Escenario();
});

test.afterEach(async () => {
  await escenario.limpiar();
});

test('cancelar una partida devuelve el 100% en saldo a quien pago', async ({ page }) => {
  // Dentro de las 48 horas: si se aplicara la politica del jugador, no habria
  // devolucion. Cuando cancela el GM, si la hay.
  const partida = await escenario.crearPartida('La que cancela el GM', {
    empiezaEnHoras: 10,
    precioCents: 1500,
  });
  await escenario.crearReserva(partida.id, USUARIOS.ana, 'PAID', 1500);

  const saldoAntes = await escenario.saldoDe(USUARIOS.ana);

  await entrarComo(page, USUARIOS.gm);
  await page.goto(`/cuenta/partidas/${partida.id}`);

  // El panel avisa de lo que va a pasar antes de pulsar.
  await expect(page.getByText(/Se devolverá el 100% en saldo a 1 jugador/)).toBeVisible();

  await page.getByRole('button', { name: 'Cancelar partida' }).click();

  // La pagina del GM no anuncia el nuevo estado (ver los hallazgos de esta
  // fase); lo que si desaparece es la posibilidad de volver a cancelarla.
  await expect(page.getByRole('button', { name: 'Cancelar partida' })).toHaveCount(0);

  // Donde si se ve es en la pagina publica de la partida.
  await page.goto(`/partidas/${partida.slug}`);
  await expect(page.getByText('Esta partida fue cancelada.')).toBeVisible();

  expect(await escenario.saldoDe(USUARIOS.ana)).toBe(saldoAntes + 1500);
});

test('la jugadora ve el abono en su saldo y la partida como reembolsada', async ({
  page,
}) => {
  const partida = await escenario.crearPartida('La cancelada', {
    empiezaEnHoras: 10,
    precioCents: 1500,
  });
  await escenario.crearReserva(partida.id, USUARIOS.ana, 'PAID', 1500);

  await entrarComo(page, USUARIOS.gm);
  await page.goto(`/cuenta/partidas/${partida.id}`);
  await page.getByRole('button', { name: 'Cancelar partida' }).click();
  await expect(page.getByRole('button', { name: 'Cancelar partida' })).toHaveCount(0);

  await entrarComo(page, USUARIOS.ana);

  await page.goto('/cuenta/saldo');
  const apunte = page.getByRole('listitem').filter({ hasText: partida.title });
  await expect(apunte.getByText('Devolución')).toBeVisible();
  await expect(apunte.getByText('+15,00 €')).toBeVisible();

  await page.goto('/mis-reservas');
  await expect(page.getByText('Reembolsada')).toBeVisible();
});
