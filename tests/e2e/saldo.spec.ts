import { expect, test } from '@playwright/test';

import { Escenario, USUARIOS } from './apoyo/datos';
import { entrarComo } from './apoyo/sesion';

/**
 * El viaje completo del saldo, que hasta ahora no se veia en ninguna parte.
 *
 * Es el camino que cierra el circulo del dinero devuelto: si el saldo no se ve
 * o no se gasta, una devolucion en saldo es indistinguible de perder el
 * dinero. Se comprueba de punta a punta —cabecera incluida— porque cada tramo
 * vive en una pantalla distinta.
 */

let escenario: Escenario;

test.beforeEach(() => {
  escenario = new Escenario();
});

test.afterEach(async () => {
  await escenario.limpiar();
});

test('el saldo de una devolución se ve en la cabecera y paga la siguiente mesa', async ({
  page,
}) => {
  const cancelada = await escenario.crearPartida('La que se cae', {
    empiezaEnHoras: 10,
    precioCents: 1500,
  });
  await escenario.crearReserva(cancelada.id, USUARIOS.ana, 'PAID', 1500);

  // Otra mesa al mismo precio, para gastar el saldo entero en ella.
  const siguiente = await escenario.crearPartida('La siguiente', {
    empiezaEnHoras: 96,
    precioCents: 1500,
  });

  const saldoAntes = await escenario.saldoDe(USUARIOS.ana);

  // El game master cancela: devolucion del 100% en saldo.
  await entrarComo(page, USUARIOS.gm);
  await page.goto(`/cuenta/partidas/${cancelada.id}`);
  await page.getByRole('button', { name: 'Cancelar partida' }).click();
  await expect(page.getByRole('heading', { name: 'Editar' })).toHaveCount(0);

  expect(await escenario.saldoDe(USUARIOS.ana)).toBe(saldoAntes + 1500);

  await entrarComo(page, USUARIOS.ana);
  await page.goto('/dashboard');

  // En la cabecera, sin tener que ir a buscarlo. El importe exacto depende de
  // lo que Ana ya tuviera, asi que se comprueba que el enlace esta y lleva
  // donde debe.
  const enCabecera = page.getByRole('banner').getByRole('link', { name: /Mi saldo/ });
  await expect(enCabecera).toBeVisible();
  await enCabecera.click();
  await expect(page.getByRole('heading', { name: 'Mi saldo' })).toBeVisible();

  // El apunte dice de que partida viene: un abono sin origen es un numero.
  await expect(page.getByText('Devolución')).toBeVisible();
  await expect(page.getByRole('link', { name: cancelada.title })).toBeVisible();

  // Y se gasta solo al reservar: la plaza queda confirmada sin pasar por la
  // pantalla de pago, porque el saldo cubre el precio entero.
  await page.goto(`/partidas/${siguiente.slug}`);
  await expect(page.getByText(/Se pagará con tu saldo/)).toBeVisible();

  await page.getByRole('button', { name: 'Reservar plaza' }).click();
  await expect(page.getByText('Tienes una plaza reservada.')).toBeVisible();

  expect(await escenario.saldoDe(USUARIOS.ana)).toBe(saldoAntes);
});
