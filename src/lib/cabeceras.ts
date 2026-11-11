/**
 * Cabeceras de seguridad HTTP.
 *
 * Logica pura, sin `server-only` ni dependencias de Node: la usan el proxy
 * (que corre en el runtime edge) y `next.config.ts`, y se comprueba en tests
 * sin levantar nada.
 *
 * Hay dos capas a proposito:
 *
 * 1. **Cabeceras fijas** (`CABECERAS_FIJAS`), que se aplican a todo y se
 *    *hacen cumplir* desde ya. Son las que no pueden romper nada: no
 *    incrustar la web en otra, no adivinar tipos MIME, no filtrar la URL
 *    completa a terceros.
 * 2. **CSP de scripts y estilos** (`construirCsp`), con un nonce distinto por
 *    peticion. Va en modo *Report-Only*: el navegador avisa en consola de lo
 *    que bloquearia, pero no bloquea. Se endurece cuando se ha recorrido la web
 *    entera sin avisos.
 */

/** Nombre de la cabecera de la CSP que aun no se hace cumplir. */
export const CABECERA_CSP = 'Content-Security-Policy-Report-Only';

/** Almacen publico de imagenes de Vercel Blob (avatares, portadas, laminas). */
const BLOB = 'https://*.public.blob.vercel-storage.com';

export function construirCsp(nonce: string, desarrollo: boolean): string {
  const directivas = [
    "default-src 'self'",
    // `strict-dynamic` deja que un script con nonce cargue los suyos; en
    // desarrollo React necesita `eval` para reconstruir las trazas.
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${desarrollo ? " 'unsafe-eval'" : ''}`,
    // Estilos en linea sin nonce: React y Tailwind escriben atributos `style`,
    // que un nonce no cubre. Los estilos no ejecutan codigo.
    "style-src 'self' 'unsafe-inline'",
    // Avatares de Discord y del almacen propio. `data:` y `blob:` para las
    // vistas previas de las imagenes que se van a subir.
    `img-src 'self' data: blob: https://cdn.discordapp.com ${BLOB}`,
    "font-src 'self'",
    // Sentry envia los errores del navegador a su propio dominio.
    `connect-src 'self' https://*.sentry.io${desarrollo ? ' ws:' : ''}`,
    "object-src 'none'",
    "base-uri 'self'",
    // Los formularios solo envian a nosotros; Discord y Stripe Checkout son
    // destinos de redireccion al entrar y al pagar.
    "form-action 'self' https://discord.com https://checkout.stripe.com",
    "frame-ancestors 'none'",
  ];

  return directivas.join('; ');
}

/** Un nonce nuevo por peticion: impredecible y en base64. */
export function nuevoNonce(): string {
  return btoa(crypto.randomUUID());
}

/**
 * Lo que se aplica a todas las respuestas y ya se hace cumplir.
 *
 * **Aqui no puede haber una `Content-Security-Policy`**, ni en `next.config.ts`
 * ni en el proxy: Next saca el nonce de la cabecera `content-security-policy`
 * (y solo mira la `-report-only` si aquella no existe), y una CSP sin
 * `script-src` le hace no poner nonce a ningun script. En produccion salian 29
 * avisos por pagina por eso. Hasta que la CSP completa se haga cumplir, el
 * framing lo cubre `X-Frame-Options`, y `frame-ancestors`, `object-src` y
 * `base-uri` viajan en la Report-Only.
 */
export const CABECERAS_FIJAS = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
] as const;
