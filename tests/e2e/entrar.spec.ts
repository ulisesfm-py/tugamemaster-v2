import { expect, test } from '@playwright/test';

import { PASSWORD, USUARIOS } from './apoyo/datos';

/**
 * Entrar y registrarse.
 *
 * Son las dos unicas pantallas sin cabecera ni pie —una sola tarea, y cada
 * enlace de mas es una puerta por la que irse a mitad—, asi que se comprueba
 * que al menos queda una manera de volver a la portada.
 */

test('un error de credenciales se explica sin sacarte del formulario', async ({
  page,
}) => {
  await page.goto('/login');

  await page.getByLabel('Email').fill(USUARIOS.ana);
  await page.getByLabel('Contraseña').fill('esta-no-es-la-buena');
  await page.getByRole('button', { name: 'Entrar' }).click();

  // Dentro del <main>: Next pone su propio role="alert" invisible para anunciar
  // los cambios de ruta, y sin acotar la busqueda salen los dos.
  // Con su tilde: es lo que lee alguien justo cuando algo le ha salido mal.
  await expect(page.getByRole('main').getByRole('alert')).toContainText(
    'Email o contraseña incorrectos',
  );
  await expect(page).toHaveURL(/\/login/);

  // El email se queda escrito y la contrasena no: equivocarse de contrasena no
  // deberia costar tambien el email, y la contrasena no vuelve del servidor.
  await expect(page.getByLabel('Email')).toHaveValue(USUARIOS.ana);
  await expect(page.getByLabel('Contraseña')).toHaveValue('');
});

test('el registro dice la longitud mínima antes de enviar nada', async ({ page }) => {
  await page.goto('/registro');

  // El mismo numero que exige el servidor, no uno escrito a mano en la vista.
  await expect(page.getByText('Al menos 10 caracteres.')).toBeVisible();
});

test('desde entrar se puede volver a la portada', async ({ page }) => {
  await page.goto('/login');

  await page.getByRole('link', { name: 'TuGameMaster' }).click();

  // Se espera a la navegacion: el <h1> de la propia pantalla de entrar sigue
  // visible hasta que llega la portada, asi que comprobarlo sin esperar se
  // cumple sin haberse movido de sitio.
  await page.waitForURL((url) => url.pathname === '/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
});

test('entrar con la contraseña correcta lleva al panel', async ({ page }) => {
  await page.goto('/login');

  await page.getByLabel('Email').fill(USUARIOS.ana);
  await page.getByLabel('Contraseña').fill(PASSWORD);
  await page.getByRole('button', { name: 'Entrar' }).click();

  await expect(page).toHaveURL(/\/dashboard|\/cuenta/);
});
