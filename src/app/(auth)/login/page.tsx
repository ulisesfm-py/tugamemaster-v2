import type { Metadata } from 'next';

import { AuthForm } from '@/components/auth-form';
import { discordEnabled } from '@/lib/env';
import { LONGITUD_MINIMA_PASSWORD } from '@/modules/users/password';
import { entrarAction, entrarConDiscordAction } from '@/modules/users/actions';

export const metadata: Metadata = { title: 'Entrar · TuGameMaster' };

export default function LoginPage() {
  return (
    <AuthForm
      modo="login"
      accion={entrarAction}
      accionDiscord={discordEnabled() ? entrarConDiscordAction : undefined}
      minimoPassword={LONGITUD_MINIMA_PASSWORD}
    />
  );
}
