import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { CABECERAS_FIJAS, construirCsp, nuevoNonce } from '@/lib/cabeceras';

describe('construirCsp', () => {
  const csp = construirCsp('abc123', false);

  it('lleva el nonce de la peticion y strict-dynamic en los scripts', () => {
    expect(csp).toContain("script-src 'self' 'nonce-abc123' 'strict-dynamic'");
  });

  it('no permite eval en produccion pero si en desarrollo', () => {
    expect(csp).not.toContain('unsafe-eval');
    expect(construirCsp('x', true)).toContain("'unsafe-eval'");
  });

  it('no deja incrustar la web, ni plugins, ni cambiar la base de las URLs', () => {
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("base-uri 'self'");
  });

  it('solo abre los origenes que la web usa de verdad', () => {
    expect(csp).toContain('https://cdn.discordapp.com');
    expect(csp).toContain('https://*.public.blob.vercel-storage.com');
    expect(csp).not.toMatch(/script-src[^;]*https:/);
    expect(csp).not.toContain('*;');
  });
});

describe('nuevoNonce', () => {
  it('es distinto en cada llamada y es base64 valido para una CSP', () => {
    const a = nuevoNonce();
    expect(a).not.toBe(nuevoNonce());
    expect(a).toMatch(/^[A-Za-z0-9+/]+=*$/);
  });
});

describe('CABECERAS_FIJAS', () => {
  // Una Content-Security-Policy "enforced" sin script-src, puesta en cualquier
  // sitio (next.config.ts o el proxy), hace que Next no ponga nonce a ningun
  // script: la prefiere a la Report-Only al buscarlo. Se vio en produccion, con
  // 29 avisos por pagina, y en local no se nota. Solo la Report-Only.
  it('no lleva ninguna Content-Security-Policy', () => {
    expect(CABECERAS_FIJAS.map((c) => c.key.toLowerCase())).not.toContain(
      'content-security-policy',
    );
  });

  it('ni next.config.ts ni el proxy ponen una CSP que no sea Report-Only', () => {
    const config = readFileSync('next.config.ts', 'utf8');
    const proxy = readFileSync('src/proxy.ts', 'utf8');

    expect(config).not.toMatch(/key:\s*['"]Content-Security-Policy['"]/i);
    expect(proxy).not.toMatch(/headers\.set\(\s*['"]Content-Security-Policy['"]/i);
  });

  const valor = (clave: string) => CABECERAS_FIJAS.find((c) => c.key === clave)?.value;

  it('incluye las cabeceras basicas', () => {
    expect(valor('X-Content-Type-Options')).toBe('nosniff');
    expect(valor('X-Frame-Options')).toBe('DENY');
    expect(valor('Referrer-Policy')).toBe('strict-origin-when-cross-origin');
  });
});

/**
 * El proxy dejo de ejecutarse en todas las rutas salvo `/` porque el matcher
 * escribia `\.` en un string de JS (que es solo un punto). Esta prueba lee el
 * matcher tal como lo interpreta Next y comprueba a quien alcanza.
 */
describe('matcher del proxy', () => {
  const fuente = readFileSync('src/proxy.ts', 'utf8');
  const literal = /matcher: \['(.*)'\]/.exec(fuente)?.[1];
  const regex = new RegExp(`^${literal}$`);

  it('alcanza las paginas, no solo la portada', () => {
    for (const ruta of [
      '/',
      '/dashboard',
      '/admin/blog',
      '/cuenta/saldo',
      '/partidas/x',
    ]) {
      expect(regex.test(ruta), ruta).toBe(true);
    }
  });

  it('deja fuera los endpoints y los ficheros estaticos', () => {
    for (const ruta of [
      '/api/cron/daily',
      '/api/auth/session',
      '/api/webhooks/stripe',
      '/_next/static/a.js',
      '/_next/image',
      '/favicon.ico',
      '/marca/logo.svg',
    ]) {
      expect(regex.test(ruta), ruta).toBe(false);
    }
  });
});
