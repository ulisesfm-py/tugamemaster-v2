import { expect, test } from '@playwright/test';

import { Escenario, USUARIOS } from './apoyo/datos';
import { entrarComo } from './apoyo/sesion';

/**
 * La ficha desde la que un game master gobierna su mesa.
 *
 * Publicar no tenia cobertura ninguna: las pruebas fabricaban las partidas ya
 * publicadas con SQL, asi que el camino que de verdad recorre un GM —crearla
 * en borrador y soltarla al portal— no lo comprobaba nadie.
 */

let escenario: Escenario;

test.beforeEach(() => {
  escenario = new Escenario();
});

test.afterEach(async () => {
  await escenario.limpiar();
});

test('un borrador no se ve en el portal hasta que su autor lo publica', async ({
  page,
}) => {
  const partida = await escenario.crearPartida('La que estaba guardada', {
    estado: 'DRAFT',
  });

  // De puertas afuera no existe.
  await page.goto('/partidas');
  await expect(page.getByRole('link', { name: partida.title })).toHaveCount(0);

  await entrarComo(page, USUARIOS.gm);
  await page.goto(`/cuenta/partidas/${partida.id}`);

  await expect(page.getByText('Todavía no la ve nadie')).toBeVisible();
  await page.getByRole('button', { name: 'Publicar' }).click();

  // Se espera a que aparezca el enlace publico, que solo existe una vez
  // publicada: mirar si el boton sigue ahi no vale, porque mientras la accion
  // corre su texto cambia y la comprobacion se cumpliria a mitad de faena.
  await expect(
    page.getByRole('link', { name: `/partidas/${partida.slug}` }),
  ).toBeVisible();

  await page.goto('/partidas');
  await expect(page.getByRole('link', { name: partida.title })).toBeVisible();
});

test('lo que no tiene vuelta atrás vive aparte del resto', async ({ page }) => {
  const partida = await escenario.crearPartida('La publicada', { precioCents: 1500 });
  await escenario.crearReserva(partida.id, USUARIOS.ana, 'PAID', 1500);

  await entrarComo(page, USUARIOS.gm);
  await page.goto(`/cuenta/partidas/${partida.id}`);

  // Cancelar avisa de lo que va a pasar con el dinero antes de pulsarlo, y no
  // comparte caja con las acciones de todos los dias.
  const peligro = page.getByRole('region', { name: 'Retirar o cancelar' });

  await expect(peligro.getByRole('button', { name: 'Cancelar partida' })).toBeVisible();
  await expect(
    peligro.getByText(/Se devolverá el 100% en saldo a 1 jugador/),
  ).toBeVisible();
  await expect(peligro.getByRole('button', { name: 'Publicar' })).toHaveCount(0);
});
