import { describe, expect, it, vi } from 'vitest';

// El modulo de avatar habla con Vercel Blob y con la base de datos. Aqui solo
// interesa la deteccion de formato, asi que ambos se sustituyen por dobles.
vi.mock('@vercel/blob', () => ({
  put: vi.fn(),
  del: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  db: { user: { findUnique: vi.fn(), update: vi.fn() } },
}));

const { subirAvatar, TAMANO_MAXIMO_BYTES } = await import('@/modules/profiles/avatar');

/** Construye un File con los bytes de cabecera indicados. */
function archivo(cabecera: number[], relleno = 32, tipo = 'image/png'): File {
  const bytes = new Uint8Array(cabecera.length + relleno);
  bytes.set(cabecera, 0);
  return new File([bytes], 'foto.png', { type: tipo });
}

const JPEG = [0xff, 0xd8, 0xff];
const PNG = [0x89, 0x50, 0x4e, 0x47];
// "RIFF" + 4 bytes de tamano + "WEBP"
const WEBP = [0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50];

describe('subirAvatar: validacion de formato', () => {
  it('rechaza un fichero vacio', async () => {
    const r = await subirAvatar('u1', new File([], 'vacio.png', { type: 'image/png' }));

    expect(r.ok).toBe(false);
  });

  it('rechaza una imagen de mas de 2 MB', async () => {
    const grande = new File([new Uint8Array(TAMANO_MAXIMO_BYTES + 1)], 'grande.png', {
      type: 'image/png',
    });

    const r = await subirAvatar('u1', grande);

    expect(r.ok).toBe(false);
    expect(!r.ok && r.mensaje).toContain('2 MB');
  });

  it('rechaza un fichero que dice ser PNG pero no lo es', async () => {
    // El caso importante: `file.type` lo manda el navegador y se puede
    // falsificar. Lo que manda son los bytes de la cabecera.
    const falso = archivo([0x3c, 0x73, 0x63, 0x72], 32, 'image/png');

    const r = await subirAvatar('u1', falso);

    expect(r.ok).toBe(false);
    expect(!r.ok && r.mensaje).toContain('JPG, PNG o WebP');
  });

  it('rechaza un RIFF que no es WebP', async () => {
    const riffAjeno = [0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x41, 0x56, 0x49, 0x20];

    const r = await subirAvatar('u1', archivo(riffAjeno));

    expect(r.ok).toBe(false);
  });

  it('rechaza una cabecera demasiado corta para identificarla', async () => {
    const r = await subirAvatar('u1', new File([new Uint8Array([0xff])], 'x.png'));

    expect(r.ok).toBe(false);
  });
});

describe('subirAvatar: formatos admitidos', () => {
  it.each([
    ['JPEG', JPEG],
    ['PNG', PNG],
    ['WebP', WEBP],
  ])('reconoce %s por su cabecera', async (_nombre, cabecera) => {
    const { put } = await import('@vercel/blob');
    const { db } = await import('@/lib/db');

    vi.mocked(db.user.findUnique).mockResolvedValue({ image: null } as never);
    vi.mocked(db.user.update).mockResolvedValue({} as never);
    vi.mocked(put).mockResolvedValue({ url: 'https://x/avatares/u1.png' } as never);

    const r = await subirAvatar('u1', archivo(cabecera));

    expect(r.ok).toBe(true);
  });
});
