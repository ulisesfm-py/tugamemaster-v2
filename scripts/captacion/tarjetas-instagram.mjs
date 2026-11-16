/**
 * Genera las tarjetas de las publicaciones de Instagram como PNG de 1080x1350.
 *
 *   node scripts/captacion/tarjetas-instagram.mjs          (todas)
 *   node scripts/captacion/tarjetas-instagram.mjs 3        (solo la publicacion 3)
 *
 * Los textos son los de `docs/captacion/instagram/publicaciones.md`: si cambia
 * uno, se cambia en los dos sitios. La salida va a
 * `docs/captacion/instagram/tarjetas/` y no se sube al repositorio.
 *
 * Usa el Chromium de Playwright (ya instalado para los E2E) y descarga las dos
 * fuentes de la web, Bricolage Grotesque y Barlow, de Google Fonts al renderizar.
 * Necesita conexion.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { chromium } from '@playwright/test';
import sharp from 'sharp';

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const SALIDA = join(RAIZ, 'docs', 'captacion', 'instagram', 'tarjetas');
const ANCHO = 1080;
const ALTO = 1350;

// --- Recursos -------------------------------------------------------------

const emblema = readFileSync(join(RAIZ, 'public', 'marca', 'logo.svg'), 'utf8')
  .replace(/<!--[\s\S]*?-->/g, '')
  .replace(/<svg /, '<svg class="emblema" ')
  .replace(/ width="32" height="32"/, '');

/** Una imagen del proyecto como data URI, opcionalmente recortada. */
async function imagen(ruta, recorte) {
  let tubo = sharp(join(RAIZ, ruta));
  if (recorte) tubo = tubo.extract(recorte);
  const buffer = await tubo.png().toBuffer();
  return `data:image/png;base64,${buffer.toString('base64')}`;
}

const FOTOS = {
  mesa: await imagen('public/marca/portada.png'),
  dragon: await imagen('public/blog/tavern-dragon-reading.webp'),
  silla: await imagen('public/blog/tavern-empty-chair.webp'),
};

/**
 * Dos paneles de la web, rehechos a mano con su mismo estilo y sus mismas
 * palabras, en vez de recortes de captura: a tamaño de movil una captura de
 * 900 px deja el texto en 6 px y no se lee. Muestran el estado vacio real de una
 * cuenta nueva (0,00 €, 0 partidas), no cifras inventadas.
 */
const estadistica = (valor, etiqueta, sub, color = '') =>
  `<div class="stat"><div class="valor ${color}">${valor}</div><div class="etiqueta">${etiqueta}</div><div class="subtexto">${sub}</div></div>`;

const PANELES = {
  // «Mis ingresos»: cobrado, en camino, retenido, por jugarse.
  ingresos: `<div class="panel"><div class="rejilla">
    ${estadistica('0,00 €', 'Cobrado', 'Ya en tu cuenta', 'o')}
    ${estadistica('0,00 €', 'En camino', 'Jugado, en el plazo de 48 h')}
    ${estadistica('0,00 €', 'Retenido', 'Hay algo que resolver')}
    ${estadistica('0,00 €', 'Por jugarse', 'Plazas vendidas de mesas futuras')}
  </div></div>`,
  // «Lo que certificamos», en el perfil de un game master.
  certificamos: `<div class="panel oro"><div class="titulo-panel">Lo que certificamos</div><div class="rejilla">
    ${estadistica('0', 'Partidas dirigidas', 'Jugadas y cobradas aquí')}
    ${estadistica('–', 'Valoración', '0 reseñas')}
    ${estadistica('0', 'Jugadores', 'Ninguno ha repetido aún')}
    ${estadistica('0', 'Canceladas', 'Con gente ya apuntada')}
  </div><p class="aviso">Estos números salen solo de partidas reservadas y pagadas en TuGameMaster. Únicamente valora quien pagó su plaza aquí, así que no se pueden inflar por fuera.</p></div>`,
};

// --- Estilo ---------------------------------------------------------------

const CSS = `
:root {
  --fondo: #17120e;
  --crema: #f2e8d5;
  --tenue: rgba(242, 232, 213, 0.72);
  --naranja: #e2622a;
  --oro: #c9973f;
  --tarjeta: #211a14;
  --linea: rgba(242, 232, 213, 0.14);
}
* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  width: ${ANCHO}px; height: ${ALTO}px; position: relative; overflow: hidden;
  background: var(--fondo); color: var(--crema);
  font-family: 'Barlow', sans-serif; -webkit-font-smoothing: antialiased;
}
.brasa {
  position: absolute; inset: 0;
  background:
    radial-gradient(900px 700px at 100% 100%, rgba(226, 98, 42, 0.2), transparent 70%),
    radial-gradient(700px 520px at 0% 0%, rgba(201, 151, 63, 0.08), transparent 70%);
}
.foto { position: absolute; left: 0; right: 0; top: 0; height: 800px; background-size: cover; background-position: center; }
.foto::after {
  content: ''; position: absolute; inset: 0;
  background: linear-gradient(to bottom, rgba(23,18,14,.62) 0%, rgba(23,18,14,.38) 35%, rgba(23,18,14,.82) 78%, var(--fondo) 100%);
}
.contenido {
  position: absolute; left: 90px; right: 90px; top: 130px; bottom: 190px;
  display: flex; flex-direction: column; justify-content: center; gap: 36px;
}
.contenido.abajo { justify-content: flex-end; }
.contenido.arriba { justify-content: flex-start; top: 150px; }
h1, h2, .cifra, .letra { font-family: 'Bricolage Grotesque', sans-serif; font-weight: 800; letter-spacing: -0.02em; }
h1 { font-size: 112px; line-height: 1.02; text-wrap: balance; }
h2 { font-size: 100px; line-height: 1.04; text-wrap: balance; }
.o { color: var(--naranja); }
.oro { color: var(--oro); }
.sub { font-size: 50px; line-height: 1.25; color: var(--tenue); font-weight: 500; text-wrap: balance; }
.kicker { font-size: 36px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; color: var(--oro); }
.lead { font-size: 68px; line-height: 1.2; font-weight: 600; text-wrap: pretty; }
.cuerpo { font-size: 56px; line-height: 1.3; color: var(--tenue); font-weight: 500; text-wrap: pretty; }
.cuerpo b, .lead b { color: var(--crema); font-weight: 700; }
.nota { font-size: 38px; line-height: 1.3; color: var(--tenue); font-weight: 500; }
.contador, .desliza {
  position: absolute; top: 74px; right: 90px; font-size: 34px; font-weight: 600;
  letter-spacing: 0.12em; color: var(--tenue);
}
.desliza { color: var(--naranja); }
.pie {
  position: absolute; left: 90px; right: 90px; bottom: 72px;
  display: flex; justify-content: space-between; align-items: center;
  border-top: 1.5px solid var(--linea); padding-top: 34px;
}
.marca { display: flex; align-items: center; gap: 18px; font-family: 'Bricolage Grotesque', sans-serif; font-weight: 800; font-size: 34px; }
.pie .emblema { width: 54px; height: 54px; }
.web { font-size: 34px; font-weight: 600; color: var(--tenue); letter-spacing: 0.02em; }
.emblema-grande { width: 190px; height: 190px; filter: drop-shadow(0 0 60px rgba(226, 98, 42, 0.45)); }
.marco {
  border-radius: 22px; overflow: hidden; border: 1.5px solid var(--linea);
  box-shadow: 0 30px 80px rgba(0, 0, 0, 0.55);
}
.marco img { display: block; width: 100%; }
.fila {
  display: flex; align-items: center; gap: 44px; padding: 38px 44px;
  background: var(--tarjeta); border: 1.5px solid var(--linea); border-radius: 24px;
}
.fila.tenue { background: transparent; border-style: dashed; }
.cifra { font-size: 120px; line-height: 1; min-width: 270px; }
.fila .texto { font-size: 50px; line-height: 1.2; font-weight: 600; }
.fila.tenue .texto { color: var(--tenue); font-weight: 500; font-style: italic; }
.fila.tenue .cifra { color: var(--tenue); }
.letra {
  width: 96px; height: 96px; flex: none; border-radius: 50%; display: grid; place-items: center;
  font-size: 56px; background: var(--naranja); color: var(--fondo);
}
.contenido.compacto { gap: 28px; }
.compacto h2 { font-size: 88px; }
.compacto .cuerpo { font-size: 48px; }
.compacto .valor { font-size: 66px; }
.compacto .fila { padding: 26px 40px; gap: 36px; }
.compacto .cifra { font-size: 104px; min-width: 240px; }
.compacto .fila .texto { font-size: 46px; }
.compacto .letra { width: 84px; height: 84px; font-size: 50px; }
.panel { background: var(--tarjeta); border: 1.5px solid var(--linea); border-radius: 24px; padding: 44px; }
.panel.oro { border-color: rgba(201, 151, 63, 0.5); background: rgba(201, 151, 63, 0.07); }
.titulo-panel { font-family: 'Bricolage Grotesque', sans-serif; font-weight: 800; font-size: 44px; color: var(--oro); margin-bottom: 30px; }
.rejilla { display: grid; grid-template-columns: 1fr 1fr; gap: 38px 40px; }
.valor { font-family: 'Bricolage Grotesque', sans-serif; font-weight: 800; font-size: 78px; line-height: 1; margin-bottom: 10px; }
.valor.o { color: var(--naranja); }
.etiqueta { font-size: 30px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; }
.subtexto { font-size: 32px; line-height: 1.25; color: var(--tenue); margin-top: 6px; }
.aviso { font-size: 30px; line-height: 1.35; color: var(--tenue); margin-top: 34px; padding-top: 28px; border-top: 1.5px solid var(--linea); }
.paso { font-family: 'Bricolage Grotesque', sans-serif; font-weight: 800; font-size: 230px; line-height: 0.8; color: var(--naranja); }
`;

// --- Piezas ---------------------------------------------------------------

const o = (t) => `<span class="o">${t}</span>`;
const parrafos = (lista) =>
  lista
    .map(
      (p, i) => `<p class="${i === 0 && lista.length > 1 ? 'lead' : 'cuerpo'}">${p}</p>`,
    )
    .join('');

function pagina(cuerpo, { contador, foto, desliza } = {}) {
  return `<!doctype html><html lang="es"><head><meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Barlow:wght@500;600;700&family=Bricolage+Grotesque:wght@700;800&display=block" rel="stylesheet">
<style>${CSS}</style></head><body>
<div class="brasa"></div>
${foto ? `<div class="foto" style="background-image:url(${foto})"></div>` : ''}
${desliza ? '<div class="desliza">DESLIZA →</div>' : contador ? `<div class="contador">${contador}</div>` : ''}
${cuerpo}
<div class="pie"><div class="marca">${emblema}<span>TuGameMaster</span></div><div class="web">tugamemaster.com</div></div>
</body></html>`;
}

const TIPOS = {
  portada: (d) => `<div class="contenido ${d.foto ? 'abajo' : ''}">
    ${d.emblema ? `<div>${emblema.replace('class="emblema"', 'class="emblema-grande"')}</div>` : ''}
    <h1>${d.titulo}</h1>${d.sub ? `<p class="sub">${d.sub}</p>` : ''}</div>`,

  texto: (d) => `<div class="contenido">
    ${d.paso ? `<div class="paso">${d.paso}</div>` : ''}
    ${d.kicker ? `<div class="kicker">${d.kicker}</div>` : ''}
    <h2>${d.titulo}</h2>${parrafos(d.cuerpo ?? [])}
    ${d.nota ? `<p class="nota">${d.nota}</p>` : ''}</div>`,

  tabla: (d) => `<div class="contenido compacto">
    <h2>${d.titulo}</h2>
    ${d.filas
      .map(
        (f) => `<div class="fila ${f.tenue ? 'tenue' : ''}">
          <div class="cifra ${f.tenue ? '' : 'o'}">${f.cifra}</div><div class="texto">${f.texto}</div></div>`,
      )
      .join('')}
    <p class="nota">${d.nota}</p></div>`,

  captura: (d) => `<div class="contenido arriba compacto">
    ${d.kicker ? `<div class="kicker">${d.kicker}</div>` : ''}
    <h2>${d.titulo}</h2>
    ${d.sinAviso ? PANELES[d.captura].replace(/<p class="aviso">.*?<\/p>/s, '') : PANELES[d.captura]}
    ${parrafos(d.cuerpo)}</div>`,

  opciones: (d) => `<div class="contenido compacto">
    <h2>${d.titulo}</h2>
    ${d.opciones
      .map(
        ([l, t]) =>
          `<div class="fila"><div class="letra">${l}</div><div class="texto">${t}</div></div>`,
      )
      .join('')}</div>`,
};

// --- Las seis publicaciones (textos de docs/captacion/instagram/publicaciones.md)

const PUBLICACIONES = [
  {
    carpeta: '1-que-es',
    tarjetas: [
      {
        tipo: 'portada',
        foto: 'mesa',
        titulo: `Aquí los game masters ${o('cobran')} por dirigir.`,
        sub: 'TuGameMaster · partidas de rol online',
      },
      {
        tipo: 'texto',
        titulo: `${o('Tú')} pones la mesa.`,
        cuerpo: [
          'Fecha, plazas y precio.',
          'El jugador reserva y paga con tarjeta. Tú no persigues pagos.',
        ],
      },
      {
        tipo: 'texto',
        titulo: 'Estamos empezando.',
        cuerpo: ['Soy Ulises, el fundador, y busco a los primeros game masters.'],
      },
    ],
  },
  {
    carpeta: '2-como-cobra',
    tarjetas: [
      {
        tipo: 'portada',
        foto: 'dragon',
        titulo: `¿Cuándo ${o('cobra')} un game master?`,
        sub: 'Así funciona, paso a paso.',
      },
      {
        tipo: 'texto',
        paso: '1',
        titulo: 'El jugador reserva y paga',
        cuerpo: ['Con tarjeta, en el momento de reservar la plaza.'],
      },
      {
        tipo: 'texto',
        paso: '2',
        titulo: 'El dinero queda retenido',
        cuerpo: [
          'La plataforma lo guarda hasta que se juega la partida. Es lo que permite decirle al jugador que su dinero está a salvo.',
        ],
      },
      {
        tipo: 'captura',
        captura: 'ingresos',
        kicker: 'Paso 3',
        titulo: 'Cobras 48 horas después de terminar',
        cuerpo: [
          'Si nadie ha reportado ninguna incidencia, la transferencia sale sola a tu cuenta. Lo ves todo en tus ingresos, mesa por mesa.',
        ],
      },
      {
        tipo: 'texto',
        titulo: `¿Y si algo ${o('falla')}?`,
        cuerpo: [
          'Una incidencia detiene ese pago hasta que se revisa a mano.',
          'Si cancelas tú, quien pagó recupera el 100 % en saldo.',
          '<b>Sin cuota mensual.</b> Un mes que no diriges, no pagas nada.',
        ],
      },
    ],
  },
  {
    carpeta: '3-fundadores',
    tarjetas: [
      {
        tipo: 'portada',
        emblema: true,
        titulo: `Buscamos ${o('10')} game masters fundadores.`,
        sub: 'Comisión reducida, y se queda así.',
      },
      {
        tipo: 'tabla',
        titulo: 'Lo que pagan los fundadores',
        filas: [
          { cifra: '0 %', texto: 'Jugadores que se registran con tu código' },
          { cifra: '5 %', texto: 'Jugadores que llegan por la web' },
          {
            cifra: '10 %',
            texto: 'Para comparar: el resto de game masters',
            tenue: true,
          },
        ],
        nota: 'El coste de Stripe se descuenta siempre del cobro.',
      },
      {
        tipo: 'texto',
        titulo: `Es ${o('permanente')}.`,
        cuerpo: [
          'No sube aunque cambie la política general. Una reserva ya hecha conserva siempre la comisión con la que se vendió.',
          'Sin cuota mensual ni permanencia. Sin exclusividad.',
        ],
      },
      {
        tipo: 'texto',
        titulo: 'Lo que no prometemos',
        cuerpo: [
          'Ningún número de reservas. La web es nueva: tus jugadores son los primeros que llenan tus mesas, y la web irá sumando los suyos.',
          `Las condiciones completas, por escrito: ${o('tugamemaster.com/fundadores')}`,
        ],
      },
    ],
  },
  {
    carpeta: '4-por-que-existe',
    tarjetas: [
      {
        tipo: 'portada',
        foto: 'silla',
        titulo: `Por qué hago ${o('esto')}.`,
        sub: 'Soy Ulises y esta es la historia de TuGameMaster.',
      },
      {
        tipo: 'texto',
        titulo: 'Hace dos años lo intenté una primera vez.',
        cuerpo: ['No funcionó: nunca llegó a ser estable.'],
      },
      {
        tipo: 'texto',
        titulo: `Así que lo rehice ${o('desde cero')}.`,
        cuerpo: [
          'Con otra base, y con el dinero de las reservas resuelto desde el principio.',
        ],
      },
      {
        tipo: 'texto',
        titulo: 'Si diriges, cuéntame cómo lo haces tú.',
        cuerpo: ['Me sirve más que cualquier encuesta.'],
      },
    ],
  },
  {
    carpeta: '5-reputacion',
    tarjetas: [
      {
        tipo: 'portada',
        emblema: true,
        titulo: `Una reseña que no se puede ${o('comprar')}.`,
      },
      {
        tipo: 'texto',
        titulo: `Solo valora quien ${o('jugó')}.`,
        cuerpo: ['Quien reservó, pagó su plaza y se sentó a la mesa. Nadie más.'],
      },
      {
        tipo: 'captura',
        captura: 'certificamos',
        sinAviso: true,
        kicker: 'Sin trampas posibles',
        titulo: 'Se valora en un plazo',
        cuerpo: [
          'Hay 60 días desde el final de la partida para valorar, y 14 para corregir la reseña antes de que se quede fija.',
        ],
      },
      {
        tipo: 'texto',
        titulo: `Salen solo de mesas pagadas en la web.`,
        cuerpo: [
          'Las estrellas y el recuento de partidas de un game master.',
          'Esa reputación es tuya, y nadie puede fingirla.',
        ],
      },
    ],
  },
  {
    carpeta: '6-pregunta',
    tarjetas: [
      {
        tipo: 'opciones',
        titulo: `Game masters: ¿cómo ${o('cobráis')} hoy vuestras mesas?`,
        opciones: [
          ['A', 'Bizum'],
          ['B', 'PayPal o transferencia'],
          ['C', 'No cobro, juego con amigos'],
          ['D', 'Otra forma (cuéntala)'],
        ],
      },
    ],
  },
];

// --- Render ---------------------------------------------------------------

const solo = process.argv[2];
const navegador = await chromium.launch();
const contexto = await navegador.newContext({ viewport: { width: ANCHO, height: ALTO } });
const pag = await contexto.newPage();

for (const [i, publicacion] of PUBLICACIONES.entries()) {
  if (solo && String(i + 1) !== solo) continue;

  const dir = join(SALIDA, publicacion.carpeta);
  mkdirSync(dir, { recursive: true });
  const total = publicacion.tarjetas.length;

  for (const [n, d] of publicacion.tarjetas.entries()) {
    const html = pagina(TIPOS[d.tipo](d), {
      contador: total > 1 ? `${n + 1} / ${total}` : undefined,
      foto: d.foto ? FOTOS[d.foto] : undefined,
      desliza: n === 0 && total > 1,
    });

    await pag.setContent(html, { waitUntil: 'networkidle' });
    await pag.evaluate(() => document.fonts.ready);

    const cargadas = await pag.evaluate(() =>
      [...document.fonts].filter((f) => f.status === 'loaded').map((f) => f.family),
    );
    if (
      !cargadas.some((f) => f.includes('Bricolage')) ||
      !cargadas.some((f) => f.includes('Barlow'))
    ) {
      throw new Error(
        `No se cargaron las fuentes (cargadas: ${cargadas.join(', ') || 'ninguna'}).`,
      );
    }

    const archivo = join(dir, `${String(n + 1).padStart(2, '0')}.png`);
    writeFileSync(archivo, await pag.screenshot({ type: 'png' }));
    console.log('ok', archivo.replace(RAIZ + '\\', '').replace(RAIZ + '/', ''));
  }
}

await navegador.close();
