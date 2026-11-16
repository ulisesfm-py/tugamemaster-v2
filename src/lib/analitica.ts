/**
 * Que se mide de la web y que no.
 *
 * Logica pura, para comprobarla sin navegador. La analitica de Vercel va sin
 * cookies y sin identificar a nadie, pero la **direccion** de cada visita si
 * viaja con ella, y hay direcciones que no deben salir de aqui:
 *
 * - Las de las areas privadas (`/cuenta`, `/mis-reservas`, `/admin`...): llevan
 *   identificadores de partidas y de reservas.
 * - `/r/<codigo>`: lleva el codigo de invitacion de un fundador.
 * - Los parametros de la direccion (`?callbackUrl=...`, `?error=...`): pueden
 *   llevar de todo. Solo se conservan los `utm_*`, que son lo que permite saber
 *   si una visita viene de un enlace nuestro, por ejemplo el de Instagram.
 */

/** Rutas cuyas visitas no se miden, con todo lo que cuelga de ellas. */
const RUTAS_PRIVADAS = [
  '/admin',
  '/api',
  '/cuenta',
  '/dashboard',
  '/login',
  '/mis-reservas',
  '/r',
  '/registro',
] as const;

const PARAMETROS_QUE_SE_CONSERVAN = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
] as const;

/** True si la ruta es una zona privada o cuelga de una. */
export function esRutaPrivada(ruta: string): boolean {
  return RUTAS_PRIVADAS.some(
    (privada) => ruta === privada || ruta.startsWith(`${privada}/`),
  );
}

/**
 * La direccion tal como se envia a la analitica, o `null` si la visita no se
 * mide. Sin parametros salvo los `utm_*`, y sin fragmento.
 */
export function urlParaMedir(url: string): string | null {
  let direccion: URL;
  try {
    direccion = new URL(url);
  } catch {
    return null;
  }

  if (esRutaPrivada(direccion.pathname)) return null;

  const utm = PARAMETROS_QUE_SE_CONSERVAN.flatMap((nombre) => {
    const valor = direccion.searchParams.get(nombre);
    return valor === null ? [] : [[nombre, valor] as const];
  });

  direccion.search = '';
  direccion.hash = '';
  for (const [nombre, valor] of utm) direccion.searchParams.set(nombre, valor);

  return direccion.toString();
}
