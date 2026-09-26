import { expect, test } from '@playwright/test';

import { consultar } from './apoyo/db';
import { Escenario, USUARIOS } from './apoyo/datos';
import { entrarComo, salir } from './apoyo/sesion';

/**
 * El hilo de mesa.
 *
 * Lo que importa aqui es la puerta: quien entra, quien deja de entrar y quien
 * ni se entera de que existe. El ir y venir de mensajes se comprueba de punta
 * a punta —el GM escribe, la jugadora lo lee y contesta— porque es el unico
 * sitio donde se ve que las dos mitades hablan de la misma mesa.
 */

let escenario: Escenario;

test.beforeEach(() => {
  escenario = new Escenario();
});

test.afterEach(async () => {
  await escenario.limpiar();
});

test('el game master escribe y quien tiene plaza lo lee y contesta', async ({ page }) => {
  const partida = await escenario.crearPartida('La del hilo');
  await escenario.crearReserva(partida.id, USUARIOS.ana, 'PAID');

  await entrarComo(page, USUARIOS.gm);
  await page.goto(`/cuenta/partidas/${partida.id}`);
  await page.getByRole('link', { name: 'Abrir el hilo' }).click();
  await page.waitForURL((url) => url.pathname === `/partidas/${partida.slug}/hilo`);

  await expect(page.getByRole('heading', { name: 'Hilo de mesa' })).toBeVisible();

  await page.getByLabel('Escribe en el hilo').fill('Empezamos a las siete en punto.');
  await page.getByRole('button', { name: 'Enviar' }).click();
  await expect(page.getByText('Empezamos a las siete en punto.')).toBeVisible();

  await salir(page);

  // La jugadora llega por donde llegaria de verdad: desde sus reservas.
  await entrarComo(page, USUARIOS.ana);
  await page.goto('/mis-reservas');

  const fila = page.getByRole('listitem').filter({ hasText: partida.title });
  await fila.getByRole('link', { name: 'Hilo de mesa' }).click();
  await page.waitForURL((url) => url.pathname === `/partidas/${partida.slug}/hilo`);

  await expect(page.getByText('Empezamos a las siete en punto.')).toBeVisible();

  await page.getByLabel('Escribe en el hilo').fill('Perfecto, allí estaré.');
  await page.getByRole('button', { name: 'Enviar' }).click();
  await expect(page.getByText('Perfecto, allí estaré.')).toBeVisible();

  // Lo suyo lo puede retirar; lo del GM no.
  const mio = page.getByRole('listitem').filter({ hasText: 'Perfecto, allí estaré.' });
  await expect(mio.getByRole('button', { name: 'Retirar' })).toBeVisible();

  const delGm = page
    .getByRole('listitem')
    .filter({ hasText: 'Empezamos a las siete en punto.' });
  await expect(delGm.getByRole('button', { name: 'Retirar' })).toHaveCount(0);
  await expect(delGm.getByRole('button', { name: 'Denunciar' })).toBeVisible();
});

test('quien no es de la mesa no encuentra el hilo', async ({ page }) => {
  const partida = await escenario.crearPartida('La del hilo ajeno');

  await entrarComo(page, USUARIOS.bruno);

  // 404, no «no autorizado»: decir que el hilo existe ya es contar algo de una
  // partida que no es suya.
  const respuesta = await page.goto(`/partidas/${partida.slug}/hilo`);
  expect(respuesta?.status()).toBe(404);
});

test('quien libera su plaza deja de entrar, pero lo que escribió se queda', async ({
  page,
}) => {
  const partida = await escenario.crearPartida('La del hilo abandonado');
  await escenario.crearReserva(partida.id, USUARIOS.ana, 'PAID');

  await entrarComo(page, USUARIOS.ana);
  await page.goto(`/partidas/${partida.slug}/hilo`);

  await page.getByLabel('Escribe en el hilo').fill('Me traigo yo los dados.');
  await page.getByRole('button', { name: 'Enviar' }).click();
  await expect(page.getByText('Me traigo yo los dados.')).toBeVisible();

  await consultar(
    `UPDATE "Booking" SET "status" = 'CANCELLED' WHERE "gameId" = $1 AND "userId" = (
       SELECT "id" FROM "User" WHERE "email" = $2
     )`,
    [partida.id, USUARIOS.ana],
  );

  await page.goto(`/partidas/${partida.slug}/hilo`);
  await expect(
    page.getByRole('heading', { name: 'Aquí no puedes entrar' }),
  ).toBeVisible();
  await expect(page.getByText('Liberaste tu plaza')).toBeVisible();

  // Su mensaje sigue en la conversacion de los demas.
  await salir(page);
  await entrarComo(page, USUARIOS.gm);
  await page.goto(`/partidas/${partida.slug}/hilo`);
  await expect(page.getByText('Me traigo yo los dados.')).toBeVisible();
});

test('el game master vacía el hilo y el hilo sigue existiendo', async ({ page }) => {
  const partida = await escenario.crearPartida('La del hilo vaciado');
  await escenario.crearReserva(partida.id, USUARIOS.ana, 'PAID');

  await entrarComo(page, USUARIOS.gm);
  await page.goto(`/partidas/${partida.slug}/hilo`);

  await page.getByLabel('Escribe en el hilo').fill('Esto no debería quedarse.');
  await page.getByRole('button', { name: 'Enviar' }).click();
  await expect(page.getByText('Esto no debería quedarse.')).toBeVisible();

  // En dos pasos, como toda accion que no se puede deshacer.
  await page.getByRole('button', { name: 'Vaciar el hilo' }).click();
  await page.getByRole('button', { name: 'Sí, borrar todos los mensajes' }).click();

  await page.goto(`/partidas/${partida.slug}/hilo`);
  await expect(page.getByText('Esto no debería quedarse.')).toHaveCount(0);
  await expect(page.getByText('Todavía no ha escrito nadie')).toBeVisible();

  // Vaciar no es cerrar.
  await page.getByLabel('Escribe en el hilo').fill('Empezamos de cero.');
  await page.getByRole('button', { name: 'Enviar' }).click();
  await expect(page.getByText('Empezamos de cero.')).toBeVisible();
});

test('un mensaje nuevo avisa en la campanita y deja de avisar al leerlo', async ({
  page,
}) => {
  const partida = await escenario.crearPartida('La del aviso');
  await escenario.crearReserva(partida.id, USUARIOS.ana, 'PAID');

  await entrarComo(page, USUARIOS.gm);
  await page.goto(`/partidas/${partida.slug}/hilo`);
  await page.getByLabel('Escribe en el hilo').fill('Cambio de hora: media hora antes.');
  await page.getByRole('button', { name: 'Enviar' }).click();
  await expect(page.getByText('Cambio de hora: media hora antes.')).toBeVisible();

  await salir(page);
  await entrarComo(page, USUARIOS.ana);
  await page.goto('/dashboard');

  // El hilo no manda correos: este es todo su aviso.
  await page.getByRole('button', { name: /^Avisos/ }).click();

  // La marca de lectura la pone el hilo al abrirse, con una accion aparte.
  // Se espera a que llegue: si no, lo que se comprobaria despues es quien
  // gana la carrera, no que el aviso se apague.
  const marcado = page.waitForResponse(
    (r) =>
      r.request().method() === 'POST' &&
      r.url().includes(`/partidas/${partida.slug}/hilo`),
  );

  await page
    .getByRole('menuitem', { name: `Un mensaje nuevo en ${partida.title}` })
    .click();
  await page.waitForURL((url) => url.pathname === `/partidas/${partida.slug}/hilo`);
  await marcado;

  // Leer el hilo apaga el aviso; si siguiera encendido, la campanita
  // ensenaria a no mirarla.
  await page.goto('/dashboard');
  await page.getByRole('button', { name: /^Avisos/ }).click();
  await expect(
    page.getByRole('menuitem', { name: new RegExp(partida.title) }),
  ).toHaveCount(0);
});

test('una denuncia llega al panel de administración y allí se retira', async ({
  page,
}) => {
  const partida = await escenario.crearPartida('La del mensaje denunciado');
  await escenario.crearReserva(partida.id, USUARIOS.ana, 'PAID');

  await entrarComo(page, USUARIOS.ana);
  await page.goto(`/partidas/${partida.slug}/hilo`);
  await page.getByLabel('Escribe en el hilo').fill('Un mensaje fuera de tono.');
  await page.getByRole('button', { name: 'Enviar' }).click();
  await expect(page.getByText('Un mensaje fuera de tono.')).toBeVisible();

  // El GM no expulsa ni borra: denuncia, como todo el mundo.
  await salir(page);
  await entrarComo(page, USUARIOS.gm);
  await page.goto(`/partidas/${partida.slug}/hilo`);
  await page.getByRole('button', { name: 'Denunciar' }).click();
  await page
    .getByLabel('¿Qué pasa con este mensaje?')
    .fill('Se pasa de tono con la mesa.');
  await page.getByRole('button', { name: 'Enviar denuncia' }).click();

  // El acuse de la accion no sobrevive a la revalidacion, asi que se comprueba
  // el estado ya guardado: el mensaje aparece marcado para todo el que lo lea.
  await expect(page.getByText('Denunciado. Lo revisa un administrador.')).toBeVisible();

  await salir(page);
  await entrarComo(page, USUARIOS.admin);
  await page.goto('/admin/hilos');

  const caso = page.getByRole('listitem').filter({ hasText: partida.title });
  await expect(caso.getByText('Se pasa de tono con la mesa.')).toBeVisible();
  await caso.getByRole('button', { name: 'Retirar el mensaje' }).click();

  // La comprobacion vuelve a la mesa, porque un administrador no entra en el
  // hilo: modera desde el panel, donde ve el mensaje sin ser de la partida.
  await salir(page);
  await entrarComo(page, USUARIOS.gm);
  await page.goto(`/partidas/${partida.slug}/hilo`);

  await expect(page.getByText('Un mensaje fuera de tono.')).toHaveCount(0);
  await expect(page.getByText('Mensaje retirado.')).toBeVisible();
});
