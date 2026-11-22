/**
 * Genera las piezas de los reels como PNG de 1080x1920 (9:16).
 *
 *   node scripts/captacion/tarjetas-reels.mjs          (todos los reels)
 *   node scripts/captacion/tarjetas-reels.mjs 2        (solo el reel 2)
 *
 * Tres clases de pieza por reel:
 *
 * - **portada**: la imagen que se elige como portada al publicar. El texto va
 *   en el centro, porque la cuadricula del perfil la recorta a 3:4.
 * - **tarjetas**: pantallas completas de texto, con fondo, que se intercalan
 *   entre las grabaciones.
 * - **rotulos**: PNG transparentes con el texto de una escena grabada. Se ponen
 *   encima del clip como superposicion, para que el texto lleve las fuentes de
 *   la marca sin depender del editor de video.
 *
 * Todo respeta la zona segura de Instagram: nada en los 250 px de arriba ni en
 * los 400 px de abajo, y un margen mayor a la derecha, donde van los botones.
 *
 * Los textos son los de `docs/captacion/reels/0N-*.md`: si cambia uno, se
 * cambia en los dos sitios. La salida va a `docs/captacion/reels/tarjetas/` y no
 * se sube al repositorio.
 *
 * Como `tarjetas-instagram.mjs`: Chromium de Playwright y las fuentes de la web
 * desde Google Fonts. Necesita conexion.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { chromium } from '@playwright/test';

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const SALIDA = join(RAIZ, 'docs', 'captacion', 'reels', 'tarjetas');
const ANCHO = 1080;
const ALTO = 1920;

/** Zona segura de un reel. */
const ARRIBA = 250;
const ABAJO = 400;

const emblema = readFileSync(join(RAIZ, 'public', 'marca', 'logo.svg'), 'utf8')
  .replace(/<!--[\s\S]*?-->/g, '')
  .replace(/<svg /, '<svg class="emblema" ')
  .replace(/ width="32" height="32"/, '');

// --- Iconos de linea, dibujados aqui para no depender de ninguna libreria ----

const trazo = (d) =>
  `<svg class="icono" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;

const ICONOS = {
  persona: trazo(
    '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8"/>',
  ),
  banco: trazo(
    '<path d="M3 10 12 4l9 6"/><path d="M5 10v8M9.5 10v8M14.5 10v8M19 10v8"/><path d="M3 21h18"/>',
  ),
  web: trazo(
    '<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3Z"/>',
  ),
  lista: trazo(
    '<path d="M9 6h11M9 12h11M9 18h11"/><path d="m3.5 6 1 1 2-2M3.5 12l1 1 2-2M3.5 18l1 1 2-2"/>',
  ),
  hilo: trazo('<path d="M4 5h16v11H9l-5 4z"/><path d="M8 9h8M8 12.5h5"/>'),
  campana: trazo(
    '<path d="M6 16V11a6 6 0 1 1 12 0v5l2 2H4z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>',
  ),
  candado: trazo(
    '<rect x="4.5" y="10.5" width="15" height="10" rx="2"/><path d="M8 10.5V7.5a4 4 0 1 1 8 0v3"/>',
  ),
};

// --- Estilo ---------------------------------------------------------------

const CSS = `
:root {
  --fondo: #17120e;
  --crema: #f2e8d5;
  --tenue: rgba(242, 232, 213, 0.74);
  --naranja: #e2622a;
  --oro: #c9973f;
  --tarjeta: #211a14;
  --linea: rgba(242, 232, 213, 0.16);
}
* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  width: ${ANCHO}px; height: ${ALTO}px; position: relative; overflow: hidden;
  color: var(--crema); font-family: 'Barlow', sans-serif; -webkit-font-smoothing: antialiased;
}
body.con-fondo { background: var(--fondo); }
body.transparente { background: transparent; }
.brasa {
  position: absolute; inset: 0;
  background:
    radial-gradient(1000px 900px at 100% 100%, rgba(226, 98, 42, 0.22), transparent 70%),
    radial-gradient(800px 700px at 0% 0%, rgba(201, 151, 63, 0.09), transparent 70%);
}
/* Zona segura: 250 px arriba, 400 abajo, y mas margen a la derecha. */
.zona {
  position: absolute; left: 96px; right: 150px; top: ${ARRIBA + 30}px; bottom: ${ABAJO + 30}px;
  display: flex; flex-direction: column; justify-content: center; gap: 44px;
}
/* La portada se recorta a 3:4 en la cuadricula: 1080x1440 centrado. */
.zona.portada { left: 120px; right: 120px; top: 320px; bottom: 320px; align-items: center; text-align: center; }
h1, h2, .num, .titulo-fila, .marca, .rotulo .titulo { font-family: 'Bricolage Grotesque', sans-serif; font-weight: 800; letter-spacing: -0.02em; }
h1 { font-size: 124px; line-height: 1.0; text-wrap: balance; }
h2 { font-size: 100px; line-height: 1.04; text-wrap: balance; }
.o { color: var(--naranja); }
.oro { color: var(--oro); }
.kicker { font-size: 38px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; color: var(--oro); }
.cuerpo { font-size: 58px; line-height: 1.28; color: var(--tenue); font-weight: 500; text-wrap: pretty; }
.cuerpo b { color: var(--crema); font-weight: 700; }
.nota { font-size: 40px; line-height: 1.3; color: var(--tenue); font-weight: 500; }
.emblema-grande { width: 200px; height: 200px; filter: drop-shadow(0 0 70px rgba(226, 98, 42, 0.45)); }
.marca { display: flex; align-items: center; gap: 20px; font-size: 44px; }
.marca .emblema { width: 72px; height: 72px; }

.filas { display: flex; flex-direction: column; gap: 26px; }
.fila {
  display: flex; align-items: center; gap: 36px; padding: 34px 40px;
  background: var(--tarjeta); border: 1.5px solid var(--linea); border-radius: 26px;
}
.fila .icono { width: 84px; height: 84px; flex: none; color: var(--naranja); }
.fila .num {
  width: 92px; height: 92px; flex: none; border-radius: 50%; display: grid; place-items: center;
  font-size: 54px; background: var(--naranja); color: var(--fondo);
}
.titulo-fila { font-size: 56px; line-height: 1.08; }
.sub-fila { font-size: 40px; line-height: 1.25; color: var(--tenue); margin-top: 8px; font-weight: 500; }
.fila.destacada { border-color: rgba(226, 98, 42, 0.7); background: rgba(226, 98, 42, 0.1); }

/* Un campo de formulario rehecho: generico a proposito, sin imitar a nadie. */
.campo { background: var(--tarjeta); border: 1.5px solid var(--linea); border-radius: 26px; padding: 44px; }
.campo .etiqueta { font-size: 40px; font-weight: 700; margin-bottom: 22px; }
.campo .control {
  background: #f8f3ea; color: #17120e; border-radius: 14px; padding: 28px 30px;
  font-size: 39px; font-weight: 600; border: 4px solid var(--naranja);
  display: flex; align-items: center; gap: 4px; white-space: nowrap;
}
.cursor { width: 4px; height: 52px; background: #17120e; display: inline-block; }
.campo .ayuda { font-size: 34px; color: var(--tenue); margin-top: 20px; line-height: 1.3; }

.url { white-space: nowrap; font-size: 42px; font-weight: 700; color: var(--naranja); letter-spacing: 0.01em; }

/* Rotulo: va sobre la grabacion, asi que lleva su propio fondo. */
.rotulo {
  position: absolute; left: 56px; right: 56px; top: ${ARRIBA + 20}px;
  background: rgba(23, 18, 14, 0.93); border: 1.5px solid var(--linea);
  border-left: 12px solid var(--naranja); border-radius: 26px;
  padding: 34px 44px 38px; box-shadow: 0 24px 70px rgba(0, 0, 0, 0.5);
  display: flex; gap: 30px; align-items: flex-start;
}
.rotulo .num {
  width: 88px; height: 88px; flex: none; border-radius: 50%; display: grid; place-items: center;
  font-family: 'Bricolage Grotesque', sans-serif; font-weight: 800;
  font-size: 52px; background: var(--naranja); color: var(--fondo);
}
.rotulo .titulo { font-size: 64px; line-height: 1.05; text-wrap: balance; }
.rotulo .titulo.grande { font-size: 84px; }
.rotulo .sub { font-size: 44px; line-height: 1.25; color: var(--tenue); margin-top: 14px; font-weight: 500; text-wrap: pretty; }
.rotulo .sub b { color: var(--crema); font-weight: 700; }
`;

// --- Piezas ---------------------------------------------------------------

const o = (t) => `<span class="o">${t}</span>`;
const parrafos = (lista = []) => lista.map((p) => `<p class="cuerpo">${p}</p>`).join('');

function pagina(cuerpo, { transparente = false } = {}) {
  return `<!doctype html><html lang="es"><head><meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Barlow:wght@500;600;700&family=Bricolage+Grotesque:wght@700;800&display=block" rel="stylesheet">
<style>${CSS}</style></head><body class="${transparente ? 'transparente' : 'con-fondo'}">
${transparente ? '' : '<div class="brasa"></div>'}
${cuerpo}
</body></html>`;
}

const fila = (f) => `<div class="fila ${f.destacada ? 'destacada' : ''}">
  ${f.icono ? ICONOS[f.icono] : `<div class="num">${f.num}</div>`}
  <div><div class="titulo-fila">${f.titulo}</div>${f.sub ? `<div class="sub-fila">${f.sub}</div>` : ''}</div>
</div>`;

const TIPOS = {
  portada: (d) => `<div class="zona portada">
    ${emblema.replace('class="emblema"', 'class="emblema-grande"')}
    ${d.kicker ? `<div class="kicker">${d.kicker}</div>` : ''}
    <h1>${d.titulo}</h1>${parrafos(d.cuerpo)}</div>`,

  texto: (d) => `<div class="zona">
    ${d.kicker ? `<div class="kicker">${d.kicker}</div>` : ''}
    <${d.grande ? 'h1' : 'h2'}>${d.titulo}</${d.grande ? 'h1' : 'h2'}>${parrafos(d.cuerpo)}
    ${d.nota ? `<p class="nota">${d.nota}</p>` : ''}</div>`,

  filas: (d) => `<div class="zona">
    ${d.kicker ? `<div class="kicker">${d.kicker}</div>` : ''}
    <h2>${d.titulo}</h2>
    <div class="filas">${d.filas.map(fila).join('')}</div>
    ${d.nota ? `<p class="nota">${d.nota}</p>` : ''}</div>`,

  campo: (d) => `<div class="zona">
    ${d.kicker ? `<div class="kicker">${d.kicker}</div>` : ''}
    <div class="campo">
      <div class="etiqueta">${d.etiqueta}</div>
      <div class="control">${d.valor}<span class="cursor"></span></div>
      ${d.ayuda ? `<div class="ayuda">${d.ayuda}</div>` : ''}
    </div>
    <h2>${d.titulo}</h2>${parrafos(d.cuerpo)}</div>`,

  cierre: (d) => `<div class="zona">
    <div class="marca">${emblema}<span>TuGameMaster</span></div>
    <h2>${d.titulo}</h2>${parrafos(d.cuerpo)}
    <div><p class="cuerpo"><b>Enlace en la bio</b></p><p class="url">${d.url}</p></div></div>`,

  rotulo: (d) => `<div class="rotulo">
    ${d.num ? `<div class="num">${d.num}</div>` : ''}
    <div><div class="titulo ${d.grande ? 'grande' : ''}">${d.titulo}</div>${d.sub ? `<div class="sub">${d.sub}</div>` : ''}</div>
  </div>`,
};

// --- Los reels (textos de docs/captacion/reels/0N-*.md) -------------------

const REELS = [
  {
    carpeta: '01-dirige-tu-primera-mesa',
    piezas: [
      {
        archivo: '00-portada',
        tipo: 'portada',
        kicker: 'Tutorial',
        titulo: `Dirige tu primera mesa en ${o('3 pasos')}`,
      },
      {
        archivo: 'escena-01-rotulo',
        tipo: 'rotulo',
        grande: true,
        titulo: `Dirige tu primera mesa en ${o('TuGameMaster')}`,
      },
      {
        archivo: 'escena-02-tarjeta',
        tipo: 'texto',
        grande: true,
        titulo: `${o('3')} pasos.`,
        cuerpo: ['Y nada se publica hasta que tú quieras.'],
      },
      {
        archivo: 'escena-03-rotulo',
        tipo: 'rotulo',
        num: '1',
        titulo: 'Crea tu cuenta',
        sub: 'Al registrarte eres <b>jugador</b>: puedes reservar mesas, todavía no dirigirlas.',
      },
      {
        archivo: 'escena-04-rotulo',
        tipo: 'rotulo',
        titulo: `Pásate a game master: ${o('«Empezar a dirigir»')}`,
        sub: 'Cuenta cómo diriges: es lo que lee quien decide si se sienta contigo.',
      },
      {
        archivo: 'escena-05-rotulo',
        tipo: 'rotulo',
        num: '2',
        titulo: 'Dónde cobrar',
        sub: 'Lo gestiona Stripe, no nosotros.',
      },
      {
        archivo: 'escena-06-tarjeta',
        tipo: 'filas',
        kicker: '2 · Dónde cobrar',
        titulo: 'Stripe te pedirá:',
        filas: [
          { icono: 'persona', titulo: 'Tus datos', sub: 'Los de quien cobra' },
          {
            icono: 'banco',
            titulo: 'Tu IBAN',
            sub: 'La cuenta donde te llega el dinero',
          },
          { icono: 'web', titulo: 'Una web', sub: 'Sirve la de tu perfil' },
        ],
      },
      {
        archivo: 'escena-07-tarjeta',
        tipo: 'campo',
        kicker: 'Cuando te pida una web',
        etiqueta: 'Sitio web',
        valor: 'tugamemaster.com/gm/tu-nombre',
        titulo: `Pon tu ${o('perfil de TuGameMaster')}.`,
        cuerpo: ['Por eso el perfil va primero.'],
      },
      {
        archivo: 'escena-08-rotulo',
        tipo: 'rotulo',
        num: '3',
        titulo: 'Tu primera partida',
        sub: 'Fecha, plazas y precio.',
      },
      {
        archivo: 'escena-09-rotulo',
        tipo: 'rotulo',
        titulo: '¿Es tu grupo de siempre?',
        sub: 'Hazla <b>privada</b>, con contraseña.',
      },
      {
        archivo: 'escena-10-rotulo',
        tipo: 'rotulo',
        titulo: `Nace como ${o('borrador')}.`,
        sub: 'La publicas cuando esté lista.',
      },
      {
        archivo: 'escena-11-tarjeta',
        tipo: 'cierre',
        titulo: `El jugador paga al reservar.`,
        cuerpo: [`<b>Tú cobras a partir de 48 h</b> después de jugar.`],
        url: 'tugamemaster.com/para-game-masters',
      },
    ],
  },
  {
    carpeta: '02-fija-flexible-campana',
    piezas: [
      {
        archivo: '00-portada',
        tipo: 'portada',
        kicker: 'Tutorial',
        titulo: `¿Fecha fija, ${o('flexible')} o campaña?`,
      },
      {
        archivo: 'escena-01-rotulo',
        tipo: 'rotulo',
        grande: true,
        titulo: `Fija, ${o('flexible')} o campaña: ¿cuál eliges?`,
      },
      {
        archivo: 'escena-02-tarjeta',
        tipo: 'filas',
        titulo: 'Tres formas de abrir mesa',
        filas: [
          {
            num: '1',
            titulo: 'Fecha fija',
            sub: 'Pones día y hora. Se reserva y se paga.',
          },
          {
            num: '2',
            titulo: 'Fecha flexible',
            sub: 'Propones una franja. Fijas el día cuando hay gente.',
            destacada: true,
          },
          {
            num: '3',
            titulo: 'Campaña',
            sub: 'La siguiente sesión de una partida ya jugada.',
          },
        ],
      },
      {
        archivo: 'escena-03-rotulo',
        tipo: 'rotulo',
        num: '1',
        titulo: 'Fecha fija',
        sub: 'Para cuando ya sabes que tienes gente.',
      },
      {
        archivo: 'escena-04-rotulo',
        tipo: 'rotulo',
        num: '2',
        titulo: 'Fecha flexible',
        sub: 'Propones una franja, por ejemplo <b>viernes a las 19:00</b>, y un mínimo de jugadores.',
      },
      {
        archivo: 'escena-05-tarjeta',
        tipo: 'texto',
        kicker: 'Fecha flexible',
        titulo: `Se apunta a quien le ${o('encaja')}.`,
        cuerpo: [
          'Es una pre-reserva: <b>no se paga nada</b> todavía.',
          'Así sabes quién vendría antes de poner el día.',
        ],
      },
      {
        archivo: 'escena-06-tarjeta',
        tipo: 'filas',
        kicker: 'Fecha flexible',
        titulo: 'Cuando llegas al mínimo',
        filas: [
          { num: '1', titulo: 'Te avisamos', sub: 'Ya puedes poner fecha.' },
          { num: '2', titulo: 'Fijas el día', sub: 'Con al menos 5 días de margen.' },
          {
            num: '3',
            titulo: '48 h de preferencia',
            sub: 'Quien se pre-reservó reserva y paga antes que nadie.',
          },
        ],
        nota: 'Después, las plazas libres son para cualquiera.',
      },
      {
        archivo: 'escena-07-tarjeta',
        tipo: 'texto',
        kicker: 'Fecha flexible',
        titulo: `Con gente apuntada, el precio ${o('no sube')}.`,
        cuerpo: ['Y las plazas no bajan. Lo que viste al apuntarte se respeta.'],
      },
      {
        archivo: 'escena-08-tarjeta',
        tipo: 'texto',
        kicker: '3 · Campaña',
        titulo: `Nace cuando ${o('continúas')} una partida ya jugada.`,
        cuerpo: ['La siguiente sesión solo la reservan quienes jugaron la anterior.'],
      },
      {
        archivo: 'escena-09-tarjeta',
        tipo: 'texto',
        kicker: 'Un consejo',
        titulo: `¿Empiezas? ${o('Ve a flexible')}.`,
        cuerpo: [
          'La web es nueva: no pongas fecha a ciegas.',
          'Abre una mesa flexible y fija el día <b>cuando ya haya gente</b>.',
        ],
      },
      {
        archivo: 'escena-10-tarjeta',
        tipo: 'cierre',
        titulo: 'Eliges el tipo al crear tu partida.',
        cuerpo: ['Y puedes tener mesas de los tres a la vez.'],
        url: 'tugamemaster.com/para-game-masters',
      },
    ],
  },
  {
    carpeta: '03-tu-grupo-aqui',
    piezas: [
      {
        archivo: '00-portada',
        tipo: 'portada',
        kicker: 'Tutorial',
        titulo: `Organiza a tu grupo de ${o('siempre')}`,
      },
      {
        archivo: 'escena-01-rotulo',
        tipo: 'rotulo',
        grande: true,
        titulo: `¿Juegas con tu grupo de ${o('siempre')}?`,
        sub: 'Organizadlo aquí, sin coste.',
      },
      {
        archivo: 'escena-02-tarjeta',
        tipo: 'texto',
        titulo: `Una partida ${o('privada')}, a 0 €.`,
        cuerpo: [
          'No le cuesta nada a nadie: ni a ti ni a tus jugadores.',
          'Sale en el listado como «Privada», pero solo reserva quien tenga la contraseña.',
        ],
      },
      {
        archivo: 'escena-03-rotulo',
        tipo: 'rotulo',
        num: '1',
        titulo: 'Precio 0 € y «Privada»',
        sub: 'La contraseña la eliges tú.',
      },
      {
        archivo: 'escena-04-rotulo',
        tipo: 'rotulo',
        num: '2',
        titulo: 'Pásales el enlace y la contraseña',
        sub: 'La tienes siempre en la gestión de la partida.',
      },
      {
        archivo: 'escena-05-tarjeta',
        tipo: 'filas',
        titulo: 'Y lo demás va solo',
        filas: [
          {
            icono: 'lista',
            titulo: 'Quién viene',
            sub: 'La lista de la mesa, siempre al día.',
          },
          {
            icono: 'hilo',
            titulo: 'Hilo de mesa',
            sub: 'Para hablar con tus jugadores.',
          },
          {
            icono: 'campana',
            titulo: 'Recordatorio',
            sub: 'Por correo, unos días antes de jugar.',
          },
        ],
      },
      {
        archivo: 'escena-06-tarjeta',
        tipo: 'texto',
        kicker: 'Un truco',
        titulo: `Que se creen la cuenta con ${o('tu enlace')}.`,
        cuerpo: [
          'Quedan como jugadores tuyos. El día que cobres una mesa, <b>por ellos no pagas comisión</b>.',
        ],
      },
      {
        archivo: 'escena-07-tarjeta',
        tipo: 'cierre',
        titulo: 'Tus mesas, en un solo sitio.',
        cuerpo: [
          'Antes de publicar: tu perfil de game master y los cobros dados de alta.',
        ],
        url: 'tugamemaster.com/para-game-masters',
      },
    ],
  },
];

// --- Render ---------------------------------------------------------------

const solo = process.argv[2];
const navegador = await chromium.launch();
const contexto = await navegador.newContext({ viewport: { width: ANCHO, height: ALTO } });
const pag = await contexto.newPage();

for (const [i, reel] of REELS.entries()) {
  if (solo && String(i + 1) !== solo) continue;

  const dir = join(SALIDA, reel.carpeta);
  mkdirSync(dir, { recursive: true });

  for (const d of reel.piezas) {
    const transparente = d.tipo === 'rotulo';
    await pag.setContent(pagina(TIPOS[d.tipo](d), { transparente }), {
      waitUntil: 'networkidle',
    });
    // Una fuente solo se descarga si algo la usa, y un rotulo sin subtitulo no
    // usa Barlow: se piden las dos para que la comprobacion de abajo valga.
    await pag.evaluate(() =>
      Promise.all([
        document.fonts.load('500 40px Barlow'),
        document.fonts.load("800 40px 'Bricolage Grotesque'"),
      ]),
    );
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

    // Nada puede salirse de la zona segura: si un texto crece, mejor saberlo
    // aqui que en el movil.
    const fuera = await pag.evaluate(
      ({ arriba, abajo, alto, ancho }) => {
        const caja = document.querySelector('.zona, .rotulo')?.getBoundingClientRect();
        if (!caja) return null;
        const hijos = [...document.querySelectorAll('.zona > *, .rotulo')].map((e) =>
          e.getBoundingClientRect(),
        );
        const top = Math.min(...hijos.map((r) => r.top));
        const bottom = Math.max(...hijos.map((r) => r.bottom));
        const right = Math.max(...hijos.map((r) => r.right));
        return top < arriba || bottom > alto - abajo || right > ancho - 40
          ? { top, bottom, right }
          : null;
      },
      { arriba: ARRIBA, abajo: ABAJO, alto: ALTO, ancho: ANCHO },
    );
    if (fuera) {
      throw new Error(
        `${reel.carpeta}/${d.archivo} se sale de la zona segura: ${JSON.stringify(fuera)}`,
      );
    }

    const archivo = join(dir, `${d.archivo}.png`);
    writeFileSync(
      archivo,
      await pag.screenshot({ type: 'png', omitBackground: transparente }),
    );
    console.log('ok', archivo.replace(RAIZ + '\\', '').replace(RAIZ + '/', ''));
  }
}

await navegador.close();
