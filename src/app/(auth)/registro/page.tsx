import type { Metadata } from 'next';

import { AuthForm } from '@/components/auth-form';
import { discordEnabled } from '@/lib/env';
import { entrarConDiscordAction, registrarAction } from '@/modules/users/actions';

export const metadata: Metadata = { title: 'Crear cuenta · TuGameMaster' };

export default function RegistroPage() {
  return (
    <AuthForm
      modo="registro"
      accion={registrarAction}
      accionDiscord={discordEnabled() ? entrarConDiscordAction : undefined}
    />
  );
}
