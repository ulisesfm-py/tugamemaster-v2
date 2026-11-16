import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { TITULAR } from '@/lib/titular';

const enviar = vi.fn();

vi.mock('resend', () => ({
  Resend: class {
    emails = { send: enviar };
  },
}));

describe('enviarCorreo: a quien se contesta', () => {
  beforeEach(() => {
    enviar.mockReset();
    enviar.mockResolvedValue({ data: { id: 'x' }, error: null });
    vi.stubEnv('RESEND_API_KEY', 're_de_prueba');
    vi.stubEnv('EMAIL_FROM', 'TuGameMaster <no-reply@tugamemaster.com>');
    vi.stubEnv('EMAIL_REDIRECT_TO', '');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('las respuestas van a la direccion de contacto, no al no-reply', async () => {
    const { enviarCorreo } = await import('@/lib/email');

    const enviado = await enviarCorreo({
      para: 'ana@example.com',
      asunto: 'Reserva confirmada',
      texto: 'Hola',
      html: '<p>Hola</p>',
    });

    expect(enviado).toBe(true);
    expect(enviar).toHaveBeenCalledWith(
      expect.objectContaining({
        from: 'TuGameMaster <no-reply@tugamemaster.com>',
        replyTo: TITULAR.correo,
      }),
    );
  });

  it('el contacto publico es una direccion del dominio, no un correo personal', () => {
    expect(TITULAR.correo.endsWith(`@${TITULAR.dominio}`)).toBe(true);
  });
});
