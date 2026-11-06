import 'server-only';

import { db } from '@/lib/db';
import { urlBase } from '@/lib/email';

import { estadoDelCodigo, formatearCodigo } from './politica';

/**
 * El codigo de un fundador y quien se ha registrado con el, para su panel.
 *
 * Null si el GM no es fundador o todavia no tiene codigo: entonces no hay
 * nada que ensenarle, y su panel no menciona los codigos.
 */
export async function invitacionDeGm(userId: string, ahora = new Date()) {
  const gm = await db.gmProfile.findUnique({
    where: { userId },
    select: {
      plan: true,
      inviteCode: true,
      inviteCodeExpiresAt: true,
      invitados: {
        orderBy: { referredAt: 'desc' },
        select: { id: true, name: true, slug: true, image: true, referredAt: true },
      },
    },
  });

  if (!gm || gm.plan !== 'FUNDADOR' || !gm.inviteCode) return null;

  return {
    codigo: formatearCodigo(gm.inviteCode),
    enlace: `${urlBase()}/r/${gm.inviteCode}`,
    caducaEl: gm.inviteCodeExpiresAt,
    vigente: estadoDelCodigo(gm, ahora) === 'VIGENTE',
    invitados: gm.invitados,
  };
}
