import { expect, test } from '@playwright/test';

import { USUARIOS } from './apoyo/datos';
import { entrarComo } from './apoyo/sesion';

/**
 * El menu de la cuenta.
 *
 * Se comprueba aqui porque cerrar sesion no tenia cobertura ninguna y resulto
 * que no se podia hacer: el avatar era un enlace al panel, asi que quien lo
 * pulsaba buscando salir acababa en otra pagina. Es de esas cosas que no
 * rompen ninguna prueba y solo se descubren usando la web.
 */

test('el avatar abre el menu de la cuenta y desde ahi se cierra sesion', async ({
  page,
}) => {
  await entrarComo(page, USUARIOS.ana);

  const cabecera = page.getByRole('banner');
  const boton = cabecera.getByRole('button', { name: 'Mi cuenta' });

  await expect(boton).toHaveAttribute('aria-expanded', 'false');
  await boton.click();
  await expect(boton).toHaveAttribute('aria-expanded', 'true');

  const menu = cabecera.getByRole('menu');
  await expect(menu.getByRole('menuitem', { name: 'Mis reservas' })).toBeVisible();

  // Escape lo cierra, que es lo que espera cualquiera de un desplegable.
  await page.keyboard.press('Escape');
  await expect(boton).toHaveAttribute('aria-expanded', 'false');

  await boton.click();
  await menu.getByRole('menuitem', { name: 'Cerrar sesión' }).click();

  // Fuera: la cabecera vuelve a ofrecer entrar.
  await expect(cabecera.getByRole('link', { name: 'Entrar' })).toBeVisible();
  await expect(cabecera.getByRole('button', { name: 'Mi cuenta' })).toHaveCount(0);
});

test('quien no dirige ve la invitación a hacerlo, y quien dirige sus atajos', async ({
  page,
}) => {
  await entrarComo(page, USUARIOS.ana);

  const menu = page.getByRole('banner').getByRole('menu');
  await page.getByRole('banner').getByRole('button', { name: 'Mi cuenta' }).click();

  await expect(menu.getByRole('menuitem', { name: 'Empezar a dirigir' })).toBeVisible();
  await expect(menu.getByRole('menuitem', { name: 'Mis ingresos' })).toHaveCount(0);

  await entrarComo(page, USUARIOS.gm);
  await page.getByRole('banner').getByRole('button', { name: 'Mi cuenta' }).click();

  await expect(menu.getByRole('menuitem', { name: 'Mis ingresos' })).toBeVisible();
  await expect(menu.getByRole('menuitem', { name: 'Empezar a dirigir' })).toHaveCount(0);
});
