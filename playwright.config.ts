import { config } from 'dotenv';
import { defineConfig, devices } from '@playwright/test';

// Playwright no lee .env.local por su cuenta, y las pruebas necesitan la
// cadena de conexion para fabricar y limpiar sus datos.
config({ path: '.env.local' });

/**
 * Pruebas de extremo a extremo.
 *
 * Levantan la aplicacion de verdad contra la base de datos de desarrollo. Cada
 * prueba se fabrica sus propios datos con identificadores unicos y los borra al
 * terminar, para poder correrlas sobre una base que ya tiene el seed dentro sin
 * pisarse con el.
 *
 * **No entran en CI todavia**: harian falta una base de datos y unos secretos
 * en el runner, y esa es una decision de infraestructura aparte. Aqui se corren
 * con `npm run e2e`.
 */
export default defineConfig({
  testDir: './tests/e2e',

  // En serie y con un solo worker: comparten base de datos, y un aforo de
  // plazas es justo lo que peor lleva que dos pruebas vayan a la vez.
  fullyParallel: false,
  workers: 1,

  // Un fallo intermitente que se arregla solo al repetir sigue siendo un fallo:
  // se prefiere verlo a esconderlo tras un reintento.
  retries: 0,

  reporter: process.env['CI'] ? 'github' : [['list']],

  use: {
    baseURL: 'http://localhost:3000',
    locale: 'es-ES',
    timezoneId: 'Europe/Madrid',
    // Solo al fallar: guardar todo hace las ejecuciones lentas y pesadas.
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },

  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    // Si ya hay un servidor levantado se reutiliza: en desarrollo es lo comodo,
    // y en CI no deberia haber ninguno.
    reuseExistingServer: !process.env['CI'],
    // El primer arranque de Next compila bajo demanda y puede tardar.
    timeout: 120_000,
    stdout: 'ignore',
    stderr: 'pipe',
    env: {
      // Reservar dispara correos de verdad. En las pruebas se apaga el envio
      // para no gastar cuota ni llenar un buzon en cada ejecucion: sin clave,
      // los avisos se vuelcan al registro.
      //
      // Ojo: con `reuseExistingServer`, un servidor arrancado a mano por fuera
      // conserva su propia configuracion y si enviara.
      RESEND_API_KEY: '',
    },
  },
});
