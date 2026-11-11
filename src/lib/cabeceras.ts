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
 * `frame-ancestors` y `X-Frame-Options` dicen lo mismo a proposito: la
 * primera es el estandar y la segunda cubre a navegadores antiguos. `object-src`
 * y `base-uri` se fijan aqui porque no dependen del nonce ni de ningun origen.
 */
export const CABECERAS_FIJAS = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  {
    key: 'Content-Security-Policy',
    value: "frame-ancestors 'none'; object-src 'none'; base-uri 'self'",
  },
] as const;
