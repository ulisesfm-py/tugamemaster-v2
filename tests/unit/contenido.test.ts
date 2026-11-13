import { describe, expect, it } from 'vitest';

import {
  clipPermitido,
  enlacePermitido,
  idDeTitulo,
  idDeYoutube,
  imagenPermitida,
  leerContenido,
  textoPlano,
} from '@/modules/blog/contenido';

const blob = 'https://abc123.public.blob.vercel-storage.com';

describe('imagenPermitida', () => {
  it('acepta ficheros propios de /blog/ y del almacen', () => {
    expect(imagenPermitida('/blog/guia/reservar.webp')).toBe(true);
    expect(imagenPermitida('/blog/portada.PNG')).toBe(true);
    expect(imagenPermitida(`${blob}/blog/p1-abc.jpg`)).toBe(true);
  });

  it('rechaza lo que se sale de la carpeta o no es una imagen', () => {
    expect(imagenPermitida('/blog/../.env')).toBe(false);
    expect(imagenPermitida('/blog/guia/../x.png')).toBe(false);
    expect(imagenPermitida('/marca/logo.svg')).toBe(false);
    expect(imagenPermitida('/blog/x.svg')).toBe(false);
    expect(imagenPermitida('/blog/x.png.exe')).toBe(false);
  });

  it('rechaza imagenes de otros sitios', () => {
    expect(imagenPermitida('https://evil.example/blog/x.png')).toBe(false);
    expect(imagenPermitida('http://abc.public.blob.vercel-storage.com/blog/x.png')).toBe(
      false,
    );
    expect(
      imagenPermitida('https://public.blob.vercel-storage.com.evil.io/blog/x.png'),
    ).toBe(false);
    expect(imagenPermitida(`${blob}/avatares/x.png`)).toBe(false);
    expect(imagenPermitida('data:image/png;base64,AAAA')).toBe(false);
    expect(imagenPermitida('javascript:alert(1)')).toBe(false);
  });
});

describe('clipPermitido', () => {
  it('acepta mp4 y webm propios o del almacen', () => {
    expect(clipPermitido('/blog/guia/reservar.mp4')).toBe(true);
    expect(clipPermitido('/blog/guia/reservar.webm')).toBe(true);
    expect(clipPermitido(`${blob}/blog/clip.mp4`)).toBe(true);
  });

  it('rechaza el resto', () => {
    expect(clipPermitido('/blog/x.png')).toBe(false);
    expect(clipPermitido('https://evil.example/blog/x.mp4')).toBe(false);
    expect(clipPermitido('/otra/x.mp4')).toBe(false);
  });
});

describe('idDeYoutube', () => {
  const id = 'AAAAAAAAAAA';

  it('reconoce las formas habituales del enlace', () => {
    expect(idDeYoutube(`https://www.youtube.com/watch?v=${id}`)).toBe(id);
    expect(idDeYoutube(`https://youtube.com/watch?v=${id}&t=10s`)).toBe(id);
    expect(idDeYoutube(`https://youtu.be/${id}`)).toBe(id);
    expect(idDeYoutube(`https://www.youtube.com/embed/${id}`)).toBe(id);
    expect(idDeYoutube(`https://www.youtube.com/shorts/${id}`)).toBe(id);
    expect(idDeYoutube(`https://www.youtube-nocookie.com/embed/${id}`)).toBe(id);
  });

  it('rechaza otros sitios, http y identificadores raros', () => {
    expect(idDeYoutube(`http://www.youtube.com/watch?v=${id}`)).toBeNull();
    expect(idDeYoutube(`https://youtube.com.evil.io/watch?v=${id}`)).toBeNull();
    expect(idDeYoutube(`https://vimeo.com/${id}`)).toBeNull();
    expect(idDeYoutube('https://www.youtube.com/watch?v=corto')).toBeNull();
    expect(idDeYoutube(`https://www.youtube.com/watch?v=${id}"onload="x`)).toBeNull();
    expect(idDeYoutube('no es una url')).toBeNull();
  });
});

describe('enlacePermitido', () => {
  it('acepta rutas de la web, anclas y https', () => {
    expect(enlacePermitido('/partidas')).toEqual({ href: '/partidas', externo: false });
    expect(enlacePermitido('#para-jugadores')).toEqual({
      href: '#para-jugadores',
      externo: false,
    });
    expect(enlacePermitido('https://stripe.com/es')?.externo).toBe(true);
  });

  it('rechaza lo peligroso o ambiguo', () => {
    expect(enlacePermitido('javascript:alert(1)')).toBeNull();
    expect(enlacePermitido('data:text/html,hola')).toBeNull();
    expect(enlacePermitido('//otro.sitio/x')).toBeNull();
    expect(enlacePermitido('http://inseguro.example')).toBeNull();
    expect(enlacePermitido('otro.sitio')).toBeNull();
    expect(enlacePermitido('mailto:alguien@example.com')).toBeNull();
  });
});

describe('idDeTitulo', () => {
  it('quita tildes, signos y espacios', () => {
    expect(idDeTitulo('¿Cómo funciona?')).toBe('como-funciona');
    expect(idDeTitulo('Si juegas: 4 pasos')).toBe('si-juegas-4-pasos');
    expect(idDeTitulo('???')).toBe('seccion');
  });
});

describe('leerContenido: bloques', () => {
  it('separa parrafos por lineas en blanco y respeta los saltos de linea', () => {
    const { bloques } = leerContenido('Una linea\nOtra linea\n\nSegundo parrafo');

    expect(bloques).toHaveLength(2);
    expect(bloques[0]).toMatchObject({ tipo: 'parrafo' });
    expect(bloques[0]?.tipo === 'parrafo' && bloques[0].lineas).toHaveLength(2);
  });

  it('lee titulos de nivel 2 y 3 con su ancla, sin repetir anclas', () => {
    const { bloques } = leerContenido('## Jugadores\n\n### Reservar\n\n## Jugadores');
    const titulos = bloques.flatMap((b) => (b.tipo === 'titulo' ? [b] : []));

    expect(titulos.map((t) => [t.nivel, t.id])).toEqual([
      [2, 'jugadores'],
      [3, 'reservar'],
      [2, 'jugadores-2'],
    ]);
  });

  it('un solo # o cuatro no son titulos', () => {
    const { bloques } = leerContenido('# Uno\n\n#### Cuatro');
    expect(bloques.every((b) => b.tipo === 'parrafo')).toBe(true);
  });

  it('lee listas con vinetas y numeradas, y no las mezcla', () => {
    const { bloques } = leerContenido('- uno\n- dos\n1. primero\n2. segundo');

    expect(bloques).toHaveLength(2);
    expect(bloques[0]).toMatchObject({ tipo: 'lista', ordenada: false });
    expect(bloques[1]).toMatchObject({ tipo: 'lista', ordenada: true });
  });

  it('lee recuadros con su etiqueta, o como nota si no la traen', () => {
    const { bloques } = leerContenido('> Consejo: lleva dados\n> y lapiz\n\n> A secas');

    expect(bloques[0]).toMatchObject({
      tipo: 'aviso',
      tono: 'consejo',
      titulo: 'Consejo',
    });
    expect(bloques[0]?.tipo === 'aviso' && bloques[0].lineas).toHaveLength(2);
    expect(bloques[1]).toMatchObject({ tipo: 'aviso', tono: 'nota', titulo: null });
  });

  it('tras la etiqueta de un recuadro, la primera letra va en mayuscula', () => {
    const { bloques } = leerContenido('> Consejo: lleva dados y lapiz');
    const aviso = bloques[0];
    const primera = aviso?.tipo === 'aviso' ? aviso.lineas[0]?.[0] : undefined;

    expect(primera).toEqual({ tipo: 'texto', texto: 'Lleva dados y lapiz' });
  });

  it('lee separadores', () => {
    expect(leerContenido('a\n\n---\n\nb').bloques.map((b) => b.tipo)).toEqual([
      'parrafo',
      'separador',
      'parrafo',
    ]);
  });

  it('una imagen valida lleva alt y pie; la invalida da un error y no sale', () => {
    const ok = leerContenido('![La ficha](/blog/guia/ficha.webp "Así se ve")');
    expect(ok.errores).toEqual([]);
    expect(ok.bloques[0]).toEqual({
      tipo: 'imagen',
      src: '/blog/guia/ficha.webp',
      alt: 'La ficha',
      pie: 'Así se ve',
    });

    const mal = leerContenido('texto\n\n![x](https://evil.example/a.png)');
    expect(mal.bloques.map((b) => b.tipo)).toEqual(['parrafo']);
    expect(mal.errores[0]).toContain('Línea 3');
  });

  it('distingue los videos de YouTube de los clips propios', () => {
    const { bloques, errores } = leerContenido(
      '@[video](https://youtu.be/AAAAAAAAAAA "Reservar")\n\n@[video](/blog/guia/reservar.mp4)',
    );

    expect(errores).toEqual([]);
    expect(bloques[0]).toEqual({ tipo: 'youtube', id: 'AAAAAAAAAAA', pie: 'Reservar' });
    expect(bloques[1]).toEqual({
      tipo: 'clip',
      src: '/blog/guia/reservar.mp4',
      pie: null,
    });
  });

  it('un video de otro sitio da un error', () => {
    const { bloques, errores } = leerContenido('@[video](https://vimeo.com/123)');

    expect(bloques).toEqual([]);
    expect(errores).toHaveLength(1);
  });
});

describe('leerContenido: texto en linea', () => {
  it('lee negrita y enlaces', () => {
    const { bloques, errores } = leerContenido(
      'Mira **esto** y [las partidas](/partidas) o [Stripe](https://stripe.com).',
    );
    const linea = bloques[0]?.tipo === 'parrafo' ? bloques[0].lineas[0] : [];

    expect(errores).toEqual([]);
    expect(linea?.map((i) => i.tipo)).toEqual([
      'texto',
      'negrita',
      'texto',
      'enlace',
      'texto',
      'enlace',
      'texto',
    ]);
  });

  it('un enlace no permitido queda como texto y da un error', () => {
    const { bloques, errores } = leerContenido('Pulsa [aqui](javascript:alert(1)) ya');

    expect(errores[0]).toContain('Línea 1');
    expect(bloques[0]?.tipo === 'parrafo' && JSON.stringify(bloques[0])).not.toContain(
      'javascript',
    );
  });

  it('el HTML no se interpreta: es texto', () => {
    const { bloques } = leerContenido('<script>alert(1)</script> y <b>negrita</b>');
    const linea = bloques[0]?.tipo === 'parrafo' ? bloques[0].lineas[0] : [];

    expect(linea).toEqual([
      { tipo: 'texto', texto: '<script>alert(1)</script> y <b>negrita</b>' },
    ]);
  });
});

describe('textoPlano', () => {
  it('quita las marcas, las imagenes y los videos', () => {
    const texto = [
      '## Guia',
      '',
      'Reserva **ya** en [partidas](/partidas).',
      '',
      '![x](/blog/a.png)',
      '@[video](/blog/a.mp4)',
      '',
      '- uno',
      '- dos',
    ].join('\n');

    expect(textoPlano(texto)).toBe('Guia Reserva ya en partidas. uno dos');
  });
});
