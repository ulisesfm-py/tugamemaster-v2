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
  const enlacePublico = page.getByRole('link', {
    name: 'Verla como la ven los jugadores',
  });

  await expect(enlacePublico).toBeVisible();
  await expect(enlacePublico).toHaveAttribute('href', `/partidas/${partida.slug}`);

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

test('la ficha no pierde lo escrito cuando la validación falla', async ({ page }) => {
  await entrarComo(page, USUARIOS.gm);
  await page.goto('/cuenta/partidas/nueva');

  // Todo bien menos la fecha. Antes, React vaciaba el formulario al terminar la
  // accion y habia que rellenar los doce campos otra vez por una sola.
  await page.getByLabel('Título').fill('La que se guardó sola');
  await page.getByLabel('Sistema de juego').fill('Vaesen');
  await page
    .getByLabel('Descripción')
    .fill(
      'Una descripción larga de sobra para pasar el mínimo, porque lo que se comprueba aquí es la fecha.',
    );
  await page.getByLabel('Experiencia que se presupone').selectOption('VETERANA');
  // Las casillas las pinta su etiqueta, asi que el `input` esta oculto a la
  // vista: se marca sin exigir visibilidad, como en las estrellas de valorar.
  await page.getByLabel('Inglés').check({ force: true });
  await page.getByLabel('Investigación').check({ force: true });
  await page.getByLabel('Edad mínima').fill('18');
  await page.getByLabel('Empieza').fill('2020-01-01T19:00');
  await page.getByLabel('Duración (horas)').fill('5');
  await page.getByLabel('Plazas').fill('6');
  await page.getByLabel('Precio por plaza (€)').fill('22.50');

  await page.getByRole('button', { name: 'Crear borrador' }).click();

  // Por texto y no por rol: el anunciador de rutas de Next tambien es un
  // `alert`, y `getByRole` encuentra dos.
  await expect(page.getByText('La partida debe empezar dentro de')).toBeVisible();

  await expect(page.getByLabel('Título')).toHaveValue('La que se guardó sola');
  await expect(page.getByLabel('Sistema de juego')).toHaveValue('Vaesen');
  await expect(page.getByLabel('Descripción')).toContainText('lo que se comprueba aquí');
  await expect(page.getByLabel('Edad mínima')).toHaveValue('18');
  await expect(page.getByLabel('Duración (horas)')).toHaveValue('5');
  await expect(page.getByLabel('Plazas')).toHaveValue('6');
  await expect(page.getByLabel('Precio por plaza (€)')).toHaveValue('22.50');
  await expect(page.getByLabel('Empieza')).toHaveValue('2020-01-01T19:00');

  // El desplegable va aparte: React no mueve la opcion marcada al repintar, y
  // se quedaba en la primera mientras la ayuda de debajo explicaba otra.
  await expect(page.getByLabel('Experiencia que se presupone')).toHaveValue('VETERANA');

  await expect(page.getByLabel('Inglés')).toBeChecked();
  await expect(page.getByLabel('Investigación')).toBeChecked();
  await expect(page.getByLabel('Español')).toBeChecked();
});
