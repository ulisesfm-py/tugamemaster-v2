import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { ReservarBoton } from '@/components/reservar-boton';
import { Avatar, Estado, Fundador, Vacio } from '@/components/ui';
import { auth } from '@/lib/auth';
import {
  COMISION_ESTANDAR,
  COMISION_FUNDADOR,
  porcentaje,
} from '@/modules/payments/dinero';
import { nuevoCodigoAction, renovarCodigoAction } from '@/modules/invitaciones/actions';
import { estadoDelCodigo, formatearCodigo } from '@/modules/invitaciones/politica';
import { cambiarPlanGmAction } from '@/modules/profiles/actions';
import { gmsParaAdmin } from '@/modules/profiles/queries';

export const metadata: Metadata = { title: 'Game masters · Admin' };

const FECHA_CORTA = new Intl.DateTimeFormat('es-ES', { dateStyle: 'long' });

/**
 * Los game masters y su plan.
 *
 * Aqui se nombra a los fundadores. Es la unica puerta: un GM no puede pedirlo
 * ni ganarlo solo, porque las condiciones se pactan en persona.
 */
export default async function GameMastersAdminPage() {
  const session = await auth();

  // El middleware ya bloquea /admin, pero se repite aqui: la seguridad no
  // puede depender de una sola capa.
  if (!session?.user?.isAdmin) notFound();

  const gms = await gmsParaAdmin();
  const ahora = new Date();
  const fundadores = gms.filter((gm) => gm.plan === 'FUNDADOR').length;

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <Link href="/admin" className="text-muted-foreground text-sm hover:underline">
        ← Administración
      </Link>

      <h1 className="font-heading text-foreground mt-4 text-3xl font-extrabold sm:text-4xl">
        Game masters
      </h1>
      <p className="text-muted-foreground mt-2">
        {gms.length === 0
          ? 'Todavía no se ha dado de alta ninguno.'
          : `${gms.length} en total, ${fundadores} ${
              fundadores === 1 ? 'fundador' : 'fundadores'
            }.`}
      </p>

      <p className="text-muted-foreground mt-4 text-sm">
        Un fundador paga un {porcentaje(COMISION_FUNDADOR)}% en lugar del{' '}
        {porcentaje(COMISION_ESTANDAR)}% y lleva el distintivo en su perfil. Cambiar el
        plan solo afecta a las reservas que vengan después: las ya hechas conservan su
        comisión.
      </p>

      {gms.length === 0 ? (
        <Vacio className="mt-8" titulo="Sin game masters">
          Aparecerán aquí en cuanto alguien rellene su perfil de game master.
        </Vacio>
      ) : (
        <ul className="mt-8 flex flex-col gap-3">
          {gms.map((gm) => {
            const esFundador = gm.plan === 'FUNDADOR';

            return (
              <li
                key={gm.id}
                className="border-border bg-card flex flex-wrap items-center gap-4 rounded-sm border p-4"
              >
                <Avatar
                  src={gm.user.image}
                  nombre={gm.user.name}
                  tamano={44}
                  fundador={esFundador}
                />

                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/gm/${gm.user.slug}`}
                      className="font-heading text-foreground font-bold hover:underline"
                    >
                      {gm.user.name}
                    </Link>
                    {esFundador && <Fundador />}
                  </p>
                  <p className="text-muted-foreground mt-0.5 text-sm break-all">
                    {gm.user.email}
                  </p>
                  <p className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                    {gm.payoutsEnabled ? (
                      <Estado tono="bien">Cobros listos</Estado>
                    ) : (
                      <Estado tono="espera">Alta de cobros sin terminar</Estado>
                    )}
                    <span className="text-muted-foreground">
                      {gm._count.games === 0
                        ? 'Sin partidas publicadas'
                        : `${gm._count.games} ${
                            gm._count.games === 1
                              ? 'partida publicada'
                              : 'partidas publicadas'
                          }`}
                    </span>
                  </p>

                  {esFundador && gm.inviteCode && (
                    <div className="border-border mt-3 border-t pt-3">
                      <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                        <span className="font-heading text-accent font-bold tracking-widest">
                          {formatearCodigo(gm.inviteCode)}
                        </span>
                        {estadoDelCodigo(gm, ahora) === 'VIGENTE' &&
                        gm.inviteCodeExpiresAt ? (
                          <span className="text-muted-foreground">
                            Vale hasta el {FECHA_CORTA.format(gm.inviteCodeExpiresAt)}
                          </span>
                        ) : (
                          <Estado tono="espera">Caducado</Estado>
                        )}
                        <span className="text-muted-foreground">
                          {gm._count.invitados === 1
                            ? '1 jugador registrado con él'
                            : `${gm._count.invitados} jugadores registrados con él`}
                        </span>
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <ReservarBoton
                          accion={renovarCodigoAction}
                          texto="Renovar 3 meses"
                          tamano="sm"
                          campos={{ gmProfileId: gm.id }}
                        />
                        <ReservarBoton
                          accion={nuevoCodigoAction}
                          texto="Código nuevo"
                          destructivo
                          tamano="sm"
                          campos={{ gmProfileId: gm.id }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <ReservarBoton
                  accion={cambiarPlanGmAction}
                  texto={esFundador ? 'Quitar fundador' : 'Hacer fundador'}
                  destructivo={esFundador}
                  tamano="sm"
                  campos={{
                    gmProfileId: gm.id,
                    plan: esFundador ? 'ESTANDAR' : 'FUNDADOR',
                  }}
                />
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
