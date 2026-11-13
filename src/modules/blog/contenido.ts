/**
 * Marcado de los articulos del blog.
 *
 * Logica pura, sin base de datos ni React: lee el texto que escribe un
 * administrador y devuelve una lista de bloques. Quien lo pinta
 * (`components/blog/contenido.tsx`) convierte cada bloque en elementos de
 * React, que escapan todo el texto por su cuenta. Por eso aqui no hay HTML en
 * bruto ni nada que sanear: lo unico que hay que vigilar son las **direcciones**
 * (imagenes, videos y enlaces), y cada una pasa por una lista de lo permitido.
 *
 * Es un marcado pequeno a proposito. Lo que entiende:
 *
 *     ## Titulo              ### Subtitulo
 *     Un parrafo con **negrita** y un [enlace](/partidas).
 *     - elemento             1. elemento numerado
 *     > Consejo: un recuadro (tambien Nota: y Ojo:)
 *     ---
 *     ![texto alternativo](/blog/guia/reservar.webp "pie opcional")
 *     @[video](https://youtu.be/XXXXXXXXXXX "pie opcional")
 *     @[video](/blog/guia/reservar.mp4)
 *
 * Todo lo demas es texto. Los saltos de linea dentro de un parrafo se respetan,
 * como antes de que existiera el marcado.
 */

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

export type Inline =
  | { tipo: 'texto'; texto: string }
  | { tipo: 'negrita'; hijos: Inline[] }
  | { tipo: 'enlace'; href: string; externo: boolean; hijos: Inline[] };

export type TonoDeAviso = 'consejo' | 'nota' | 'ojo';

export type Bloque =
  | { tipo: 'titulo'; nivel: 2 | 3; id: string; hijos: Inline[] }
  | { tipo: 'parrafo'; lineas: Inline[][] }
  | { tipo: 'lista'; ordenada: boolean; items: Inline[][] }
  | { tipo: 'aviso'; tono: TonoDeAviso; titulo: string | null; lineas: Inline[][] }
  | { tipo: 'separador' }
  | { tipo: 'imagen'; src: string; alt: string; pie: string | null }
  | { tipo: 'youtube'; id: string; pie: string | null }
  | { tipo: 'clip'; src: string; pie: string | null };

export type Contenido = {
  bloques: Bloque[];
  /** Problemas que el autor debe corregir, con el numero de linea. */
  errores: string[];
};

// ---------------------------------------------------------------------------
// Direcciones permitidas
// ---------------------------------------------------------------------------

/**
 * Dominio de nuestro almacen de imagenes. Es el mismo de `lib/imagen.ts`, que
 * no se puede importar aqui porque lleva `server-only` y esto lo usa tambien
 * el editor.
 */
const DOMINIO_BLOB = '.public.blob.vercel-storage.com';

const EXTENSIONES_IMAGEN = 'png|jpe?g|webp|gif';
const EXTENSIONES_CLIP = 'mp4|webm';

/**
 * Ficheros propios, en `public/blog/`. Sin puntos salvo el de la extension: asi
 * no cabe `..` ni nada que se salga de la carpeta.
 */
function rutaPropia(src: string, extensiones: string): boolean {
  return new RegExp(`^/blog/[a-z0-9][a-z0-9/_-]*\\.(${extensiones})$`, 'i').test(src);
}

/** Ficheros del almacen Blob, siempre bajo `/blog/`. */
function enBlob(src: string, extensiones: string): boolean {
  try {
    const url = new URL(src);

    return (
      url.protocol === 'https:' &&
      url.hostname.endsWith(DOMINIO_BLOB) &&
      new RegExp(`^/blog/[^?#]+\\.(${extensiones})$`, 'i').test(url.pathname)
    );
  } catch {
    return false;
  }
}

export function imagenPermitida(src: string): boolean {
  return rutaPropia(src, EXTENSIONES_IMAGEN) || enBlob(src, EXTENSIONES_IMAGEN);
}

export function clipPermitido(src: string): boolean {
  return rutaPropia(src, EXTENSIONES_CLIP) || enBlob(src, EXTENSIONES_CLIP);
}

const HOSTS_YOUTUBE = new Set([
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'youtube-nocookie.com',
  'www.youtube-nocookie.com',
  'youtu.be',
]);

const ID_YOUTUBE = /^[A-Za-z0-9_-]{11}$/;

/** El identificador de un video de YouTube, o null si no lo es. */
export function idDeYoutube(src: string): string | null {
  let url: URL;
  try {
    url = new URL(src);
  } catch {
    return null;
  }

  if (url.protocol !== 'https:' || !HOSTS_YOUTUBE.has(url.hostname)) return null;

  let candidato: string | undefined;

  if (url.hostname === 'youtu.be') {
    candidato = url.pathname.slice(1);
  } else if (url.pathname === '/watch') {
    candidato = url.searchParams.get('v') ?? undefined;
  } else {
    // /embed/ID, /shorts/ID, /live/ID
    candidato = /^\/(?:embed|shorts|live)\/([^/]+)$/.exec(url.pathname)?.[1];
  }

  return candidato && ID_YOUTUBE.test(candidato) ? candidato : null;
}

/**
 * Enlaces: internos, anclas de la propia pagina o https. Nada de `javascript:`,
 * `data:` ni direcciones sin protocolo que el navegador resuelva por su cuenta.
 */
export function enlacePermitido(href: string): { href: string; externo: boolean } | null {
  if (/^#[a-z0-9-]+$/.test(href)) return { href, externo: false };

  // `//otro.sitio` parece una ruta pero es una direccion externa sin protocolo.
  if (/^\/(?!\/)[^\s]*$/.test(href)) return { href, externo: false };

  try {
    const url = new URL(href);
    if (url.protocol === 'https:') return { href: url.toString(), externo: true };
  } catch {
    // no es una direccion
  }

  return null;
}

// ---------------------------------------------------------------------------
// Texto en linea
// ---------------------------------------------------------------------------

type Errores = string[];

/**
 * Negrita y enlaces. Un enlace puede llevar negrita dentro; la negrita no
 * lleva enlaces: con eso basta y evita anidar sin limite.
 */
function leerInline(
  texto: string,
  linea: number,
  errores: Errores,
  soloNegrita = false,
): Inline[] {
  const resultado: Inline[] = [];
  const patron = soloNegrita
    ? /\*\*(.+?)\*\*/g
    : /\*\*(.+?)\*\*|\[([^\]]+)\]\(([^\s)]+)\)/g;

  let desde = 0;

  const anadirTexto = (t: string) => {
    if (t) resultado.push({ tipo: 'texto', texto: t });
  };

  for (const m of texto.matchAll(patron)) {
    const inicio = m.index ?? 0;
    anadirTexto(texto.slice(desde, inicio));
    desde = inicio + m[0].length;

    if (m[1] !== undefined) {
      resultado.push({
        tipo: 'negrita',
        hijos: soloNegrita
          ? [{ tipo: 'texto', texto: m[1] }]
          : leerInline(m[1], linea, errores, true),
      });
      continue;
    }

    const etiqueta = m[2] ?? '';
    const destino = enlacePermitido(m[3] ?? '');

    if (!destino) {
      errores.push(
        `Línea ${linea}: el enlace «${m[3]}» no vale. Usa una ruta de la web (/partidas), un ancla (#titulo) o una dirección https.`,
      );
      anadirTexto(etiqueta);
      continue;
    }

    resultado.push({
      tipo: 'enlace',
      ...destino,
      hijos: leerInline(etiqueta, linea, errores, true),
    });
  }

  anadirTexto(texto.slice(desde));
  return resultado;
}

/** El texto de una lista de elementos en linea, sin ninguna marca. */
function planoDeInline(hijos: Inline[]): string {
  return hijos
    .map((h) => (h.tipo === 'texto' ? h.texto : planoDeInline(h.hijos)))
    .join('');
}

// ---------------------------------------------------------------------------
// Bloques
// ---------------------------------------------------------------------------

const TITULO = /^(#{2,3})\s+(.+?)\s*#*$/;
const SEPARADOR = /^(-{3,}|\*{3,})$/;
const VINETA = /^[-*]\s+(.*)$/;
const NUMERADO = /^\d+[.)]\s+(.*)$/;
const CITA = /^>\s?(.*)$/;
const IMAGEN = /^!\[([^\]]*)\]\(([^\s)]+)(?:\s+"([^"]*)")?\)$/;
const VIDEO = /^@\[video\]\(([^\s)]+)(?:\s+"([^"]*)")?\)$/;
const AVISO = /^(Consejo|Nota|Ojo):\s*(.*)$/i;

const TONOS: Record<string, TonoDeAviso> = {
  consejo: 'consejo',
  nota: 'nota',
  ojo: 'ojo',
};

/**
 * La primera letra en mayuscula. Tras una etiqueta («Consejo: lleva dados») el
 * texto empieza una frase aparte, y escribirla en minuscula en el editor es lo
 * natural: la etiqueta ya hace de comienzo.
 */
function conMayuscula(texto: string): string {
  return texto.charAt(0).toLocaleUpperCase('es') + texto.slice(1);
}

/** Una direccion para anclas: sin tildes, en minusculas y con guiones. */
export function idDeTitulo(titulo: string): string {
  return (
    titulo
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'seccion'
  );
}

export function leerContenido(texto: string): Contenido {
  const lineas = texto.replace(/\r\n?/g, '\n').split('\n');
  const bloques: Bloque[] = [];
  const errores: Errores = [];
  const idsUsados = new Map<string, number>();

  let parrafo: { texto: string; n: number }[] = [];
  let lista: { ordenada: boolean; items: { texto: string; n: number }[] } | null = null;
  let cita: { texto: string; n: number }[] = [];

  const cerrarParrafo = () => {
    if (parrafo.length === 0) return;
    bloques.push({
      tipo: 'parrafo',
      lineas: parrafo.map((l) => leerInline(l.texto, l.n, errores)),
    });
    parrafo = [];
  };

  const cerrarLista = () => {
    if (!lista) return;
    bloques.push({
      tipo: 'lista',
      ordenada: lista.ordenada,
      items: lista.items.map((i) => leerInline(i.texto, i.n, errores)),
    });
    lista = null;
  };

  const cerrarCita = () => {
    if (cita.length === 0) return;

    const [primera, ...resto] = cita;
    const etiqueta = AVISO.exec(primera?.texto ?? '');
    const tono = etiqueta ? (TONOS[(etiqueta[1] ?? '').toLowerCase()] ?? 'nota') : 'nota';
    const cuerpo = etiqueta
      ? [{ texto: conMayuscula(etiqueta[2] ?? ''), n: primera?.n ?? 0 }, ...resto]
      : cita;

    bloques.push({
      tipo: 'aviso',
      tono,
      titulo: etiqueta ? (etiqueta[1] ?? '') : null,
      lineas: cuerpo
        .filter((l) => l.texto.trim() !== '')
        .map((l) => leerInline(l.texto, l.n, errores)),
    });
    cita = [];
  };

  const cerrarTodo = () => {
    cerrarParrafo();
    cerrarLista();
    cerrarCita();
  };

  lineas.forEach((cruda, indice) => {
    const n = indice + 1;
    const linea = cruda.trim();

    if (linea === '') return cerrarTodo();

    const titulo = TITULO.exec(linea);
    if (titulo) {
      cerrarTodo();
      const texto = titulo[2] ?? '';
      const base = idDeTitulo(texto);
      const veces = idsUsados.get(base) ?? 0;
      idsUsados.set(base, veces + 1);

      return bloques.push({
        tipo: 'titulo',
        nivel: titulo[1]?.length === 2 ? 2 : 3,
        id: veces === 0 ? base : `${base}-${veces + 1}`,
        hijos: leerInline(texto, n, errores),
      });
    }

    if (SEPARADOR.test(linea)) {
      cerrarTodo();
      return bloques.push({ tipo: 'separador' });
    }

    const imagen = IMAGEN.exec(linea);
    if (imagen) {
      cerrarTodo();
      const src = imagen[2] ?? '';

      if (!imagenPermitida(src)) {
        errores.push(
          `Línea ${n}: la imagen «${src}» no vale. Usa un fichero de /blog/ (png, jpg, webp o gif) o una imagen de nuestro almacén.`,
        );
        return;
      }

      return bloques.push({
        tipo: 'imagen',
        src,
        alt: imagen[1] ?? '',
        pie: imagen[3] || null,
      });
    }

    const video = VIDEO.exec(linea);
    if (video) {
      cerrarTodo();
      const src = video[1] ?? '';
      const pie = video[2] || null;
      const id = idDeYoutube(src);

      if (id) return bloques.push({ tipo: 'youtube', id, pie });
      if (clipPermitido(src)) return bloques.push({ tipo: 'clip', src, pie });

      errores.push(
        `Línea ${n}: el vídeo «${src}» no vale. Usa un enlace de YouTube o un fichero /blog/… en mp4 o webm.`,
      );
      return;
    }

    const lineaDeCita = CITA.exec(linea);
    if (lineaDeCita) {
      cerrarParrafo();
      cerrarLista();
      return cita.push({ texto: lineaDeCita[1] ?? '', n });
    }

    const vineta = VINETA.exec(linea);
    const numerado = vineta ? null : NUMERADO.exec(linea);
    const elemento = vineta ?? numerado;

    if (elemento) {
      cerrarParrafo();
      cerrarCita();
      const ordenada = numerado !== null;

      if (lista && lista.ordenada !== ordenada) cerrarLista();
      lista ??= { ordenada, items: [] };
      return lista.items.push({ texto: elemento[1] ?? '', n });
    }

    cerrarLista();
    cerrarCita();
    parrafo.push({ texto: linea, n });
  });

  cerrarTodo();

  return { bloques, errores };
}

// ---------------------------------------------------------------------------
// Usos derivados
// ---------------------------------------------------------------------------

/**
 * El articulo como texto corrido, sin marcas ni imagenes: lo que se recorta
 * para el resumen del listado y la descripcion de la pagina.
 */
export function textoPlano(texto: string): string {
  const { bloques } = leerContenido(texto);
  const trozos: string[] = [];

  for (const b of bloques) {
    switch (b.tipo) {
      case 'titulo':
        trozos.push(planoDeInline(b.hijos));
        break;
      case 'parrafo':
      case 'aviso':
        trozos.push(...b.lineas.map(planoDeInline));
        break;
      case 'lista':
        trozos.push(...b.items.map(planoDeInline));
        break;
      default:
        break;
    }
  }

  return trozos.join(' ').replace(/\s+/g, ' ').trim();
}
