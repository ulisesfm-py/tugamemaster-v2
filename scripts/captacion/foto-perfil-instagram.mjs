/**
 * Foto de perfil de Instagram con el emblema y el nombre apilados, para que
 * quepan en el recorte circular.
 *
 *   node scripts/captacion/foto-perfil-instagram.mjs
 *
 * Genera dos variantes en `docs/captacion/instagram/` y una vista previa de
 * como queda en circulo a tres tamaños. Usa las fuentes de la web (Google
 * Fonts, necesita conexion) y el emblema de `public/marca/logo.svg`.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { chromium } from '@playwright/test';

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const SALIDA = join(RAIZ, 'docs', 'captacion', 'instagram');
const LADO = 1080;

const emblema = readFileSync(join(RAIZ, 'public', 'marca', 'logo.svg'), 'utf8')
  .replace(/<!--[\s\S]*?-->/g, '')
  .replace(/<svg /, '<svg class="emblema" ')
  .replace(/ width="32" height="32"/, '');

// `emblema`: lado del emblema; `texto`: tamaño del nombre. El conjunto va
// centrado, dentro de un circulo de ~800 px para que el recorte no lo toque.
const VARIANTES = [
  { archivo: 'foto-de-perfil-logo.png', emblema: 420, texto: 112, hueco: 44 },
  { archivo: 'foto-de-perfil-logo-grande.png', emblema: 500, texto: 100, hueco: 40 },
];

const pagina = ({
  emblema: lado,
  texto,
  hueco,
}) => `<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@800&display=block" rel="stylesheet">
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { width: ${LADO}px; height: ${LADO}px; background: #17120e; display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: ${hueco}px; }
.emblema { width: ${lado}px; height: ${lado}px; filter: drop-shadow(0 0 70px rgba(226, 98, 42, 0.38)); }
.nombre { font-family: 'Bricolage Grotesque', sans-serif; font-weight: 800; font-size: ${texto}px;
  letter-spacing: -0.02em; color: #f2e8d5; line-height: 1; }
</style></head><body>${emblema}<div class="nombre">TuGameMaster</div></body></html>`;

const navegador = await chromium.launch();
const pag = await navegador.newPage({ viewport: { width: LADO, height: LADO } });

const vistas = [];
for (const v of VARIANTES) {
  await pag.setContent(pagina(v), { waitUntil: 'networkidle' });
  await pag.evaluate(() => document.fonts.ready);
  const cargada = await pag.evaluate(() =>
    [...document.fonts].some(
      (f) => f.family.includes('Bricolage') && f.status === 'loaded',
    ),
  );
  if (!cargada) throw new Error('No se cargo la fuente.');

  const png = await pag.screenshot({ type: 'png' });
  writeFileSync(join(SALIDA, v.archivo), png);
  vistas.push(`data:image/png;base64,${png.toString('base64')}`);
  console.log('ok', v.archivo);
}

// Vista previa: cada variante recortada en circulo a 320, 150 y 56 px.
const tamanos = [320, 150, 56];
await pag.setViewportSize({ width: 600, height: 20 + vistas.length * (320 + 20) });
await pag.setContent(`<!doctype html><body style="margin:0;background:#0b0f17;display:flex;flex-direction:column;gap:20px;padding:20px">
${vistas
  .map(
    (src) =>
      `<div style="display:flex;align-items:center;gap:30px">${tamanos
        .map(
          (t) =>
            `<img src="${src}" style="width:${t}px;height:${t}px;border-radius:50%;object-fit:cover">`,
        )
        .join('')}</div>`,
  )
  .join('')}</body>`);
mkdirSync(join(SALIDA, 'tarjetas'), { recursive: true });
writeFileSync(
  join(SALIDA, 'tarjetas', 'vista-previa-foto-de-perfil.png'),
  await pag.screenshot({ type: 'png' }),
);

await navegador.close();
