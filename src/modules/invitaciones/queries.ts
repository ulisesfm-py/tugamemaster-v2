import 'server-only';

import { db } from '@/lib/db';
import { urlBase } from '@/lib/email';

import { estadoDelCodigo, formatearCodigo } from './politica';

/**
 * El codigo de un game master y quien se ha registrado con el, para su panel.
 *
 * Null si el usuario no es game master. Si lo es pero aun no ha pedido su
 * enlace, `codigo` es null y el panel le ofrece crearlo.
 */
export async function invitacionDeGm(userId: string, ahora = new Date()) {
  const gm = await db.gmProfile.findUnique({
    where: { userId },
    select: {
      inviteCode: true,
      inviteCodeExpiresAt: true,
      invitados: {
        orderBy: { referredAt: 'desc' },
        select: { id: true, name: true, slug: true, image: true, referredAt: true },
      },
    },
  });

  if (!gm) return null;

  if (!gm.inviteCode) {
    return { codigo: null, enlace: null, caducaEl: null, vigente: false, invitados: [] };
  }

  return {
    codigo: formatearCodigo(gm.inviteCode),
    enlace: `${urlBase()}/r/${gm.inviteCode}`,
    caducaEl: gm.inviteCodeExpiresAt,
    vigente: estadoDelCodigo(gm, ahora) === 'VIGENTE',
    invitados: gm.invitados,
  };
}
