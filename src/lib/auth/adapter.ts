import { PrismaAdapter } from '@auth/prisma-adapter';
import type { Adapter, AdapterUser } from 'next-auth/adapters';

import { db } from '@/lib/db';
import { recogerCodigoDeViaje } from '@/modules/invitaciones/cookie';
import { buscarCodigo } from '@/modules/invitaciones/service';
import { slugDisponible } from '@/modules/users/slug';

/**
 * Adaptador de Prisma con lo que a Auth.js le falta saber de nuestro modelo.
 *
 * El adaptador estandar crea el usuario con name, email, emailVerified e
 * image. Nuestro `User` exige ademas un `slug` unico y un `name` no nulo, asi
 * que sin esto el primer inicio de sesion con Discord fallaria con
 * "Argument `slug` is missing".
 */
export function crearAdaptador(): Adapter {
  const base = PrismaAdapter(db);

  return {
    ...base,

    async createUser(data: AdapterUser) {
      // Discord siempre manda un nombre, pero el tipo lo declara opcional y
      // otros proveedores podrian no enviarlo. Sin fallback, el insert falla.
      const name = data.name?.trim() || data.email.split('@')[0] || 'Usuario';

      const slug = await slugDisponible(name, async (candidato) => {
        const ocupado = await db.user.findUnique({
          where: { slug: candidato },
          select: { id: true },
        });
        return ocupado !== null;
      });

      // El codigo de fundador que se escribio antes de salir hacia Discord.
      // Ya se comprobo al salir; aqui se comprueba otra vez porque pudo
      // caducar mientras tanto, y si ya no vale la cuenta se crea igual.
      const codigo = await recogerCodigoDeViaje();
      const invitacion = codigo ? await buscarCodigo(codigo) : null;
      const invitadoPor = invitacion?.ok ? invitacion.gmProfileId : null;

      const creado = await db.user.create({
        data: {
          email: data.email,
          emailVerified: data.emailVerified,
          name,
          slug,
          image: data.image ?? null,
          referredByGmId: invitadoPor,
          referredAt: invitadoPor ? new Date() : null,
        },
      });

      return {
        id: creado.id,
        email: creado.email,
        emailVerified: creado.emailVerified,
        name: creado.name,
        image: creado.image,
        slug: creado.slug,
        isAdmin: creado.isAdmin,
      };
    },

    /**
     * Al enlazar una cuenta de Discord, copia su ID a `User.discordId`.
     *
     * CLAUDE.md lo pide para las salas de partida del backlog. Aunque el dato
     * vive tambien en `Account.providerAccountId`, tenerlo en User evita un
     * join en cada consulta y deja claro que es un dato del usuario, no del
     * proveedor de acceso.
     */
    async linkAccount(account) {
      await base.linkAccount!(account);

      if (account.provider === 'discord') {
        await db.user.update({
          where: { id: account.userId },
          data: { discordId: account.providerAccountId },
        });
      }

      return account;
    },
  };
}
