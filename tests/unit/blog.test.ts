import { describe, expect, it } from 'vitest';

import { puedeBorrarComentario, resumenDe } from '@/modules/blog/politica';
import { comentarioSchema, postSchema } from '@/modules/blog/schema';

describe('puedeBorrarComentario', () => {
  const comentario = { autorId: 'ana' };

  it('su autor puede retirarlo', () => {
    expect(puedeBorrarComentario(comentario, { id: 'ana', esAdmin: false })).toBe(true);
  });

  it('un administrador puede retirar el de cualquiera', () => {
    expect(puedeBorrarComentario(comentario, { id: 'admin', esAdmin: true })).toBe(true);
  });

  it('nadie mas puede', () => {
    expect(puedeBorrarComentario(comentario, { id: 'bruno', esAdmin: false })).toBe(
      false,
    );
  });
});

describe('resumenDe', () => {
  it('usa el resumen propio del articulo cuando lo hay', () => {
    expect(
      resumenDe({ excerpt: 'Un resumen escrito a mano', content: 'Otra cosa distinta' }),
    ).toBe('Un resumen escrito a mano');
  });

  it('si no hay resumen, recorta el cuerpo', () => {
    const content = `${'palabra '.repeat(60)}final`;
    const resumen = resumenDe({ excerpt: null, content });

    expect(resumen.length).toBeLessThanOrEqual(201);
    expect(resumen.endsWith('…')).toBe(true);
  });

  it('no parte una palabra por la mitad', () => {
    const content = `${'palabra '.repeat(60)}final`;
    const resumen = resumenDe({ excerpt: null, content });

    // Quitando los puntos suspensivos, lo que queda son palabras completas.
    for (const palabra of resumen.slice(0, -1).trim().split(' ')) {
      expect(palabra).toBe('palabra');
    }
  });

  it('el resumen sale sin marcas, imagenes ni videos', () => {
    const content =
      '## Guia\n\n![x](/blog/a.png)\n\nReserva **ya** en [partidas](/partidas).';

    expect(resumenDe({ excerpt: null, content })).toBe('Guia Reserva ya en partidas.');
  });

  it('un cuerpo corto se devuelve entero y sin puntos suspensivos', () => {
    expect(resumenDe({ excerpt: null, content: 'Dos lineas nada mas.' })).toBe(
      'Dos lineas nada mas.',
    );
  });

  it('colapsa los saltos de linea del cuerpo', () => {
    expect(resumenDe({ excerpt: null, content: 'Primera\n\nSegunda' })).toBe(
      'Primera Segunda',
    );
  });

  it('corta en seco un texto sin espacios donde cortar', () => {
    const resumen = resumenDe({ excerpt: null, content: 'a'.repeat(300) });

    expect(resumen).toHaveLength(201);
    expect(resumen.endsWith('…')).toBe(true);
  });
});

describe('postSchema', () => {
  const valido = {
    title: 'Como preparar tu primera partida',
    content: 'a'.repeat(60),
  };

  it('acepta imagenes, videos y enlaces permitidos', () => {
    const content = [
      '## Guia',
      '',
      'Reserva en [partidas](/partidas) y mira el video.',
      '',
      '![Ficha](/blog/guia/ficha.webp "Pie")',
      '@[video](https://youtu.be/AAAAAAAAAAA)',
    ].join('\n');

    expect(postSchema.safeParse({ ...valido, content }).success).toBe(true);
  });

  it('rechaza una imagen de otro sitio diciendo en que linea esta', () => {
    const content = `${'a'.repeat(60)}\n\n![x](https://evil.example/a.png)`;
    const r = postSchema.safeParse({ ...valido, content });

    expect(r.success).toBe(false);
    expect(r.error?.issues[0]?.path).toEqual(['content']);
    expect(r.error?.issues[0]?.message).toContain('Línea 3');
  });

  it('rechaza un enlace javascript:', () => {
    const content = `${'a'.repeat(60)} [pulsa](javascript:alert(1))`;

    expect(postSchema.safeParse({ ...valido, content }).success).toBe(false);
  });

  it('acepta un articulo sin resumen y lo guarda como null', () => {
    expect(postSchema.parse(valido).excerpt).toBeNull();
  });

  it('acepta las tres formas de "sin resumen"', () => {
    for (const excerpt of [null, undefined, '   ']) {
      expect(postSchema.parse({ ...valido, excerpt }).excerpt).toBeNull();
    }
  });

  it('rechaza un titulo corto', () => {
    expect(postSchema.safeParse({ ...valido, title: 'Hi' }).success).toBe(false);
  });

  it('rechaza un articulo casi vacio', () => {
    expect(postSchema.safeParse({ ...valido, content: 'Muy corto' }).success).toBe(false);
  });

  it('recorta los espacios del titulo', () => {
    expect(
      postSchema.parse({ ...valido, title: '  Un titulo con espacios  ' }).title,
    ).toBe('Un titulo con espacios');
  });
});

describe('comentarioSchema', () => {
  it('acepta un comentario normal', () => {
    expect(comentarioSchema.parse({ body: '  Muy buen articulo  ' }).body).toBe(
      'Muy buen articulo',
    );
  });

  it('rechaza un comentario en blanco', () => {
    expect(comentarioSchema.safeParse({ body: '   ' }).success).toBe(false);
  });

  it('rechaza un comentario kilometrico', () => {
    expect(comentarioSchema.safeParse({ body: 'a'.repeat(2001) }).success).toBe(false);
  });
});
