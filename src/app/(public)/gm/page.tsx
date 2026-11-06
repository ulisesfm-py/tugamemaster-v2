import type { Metadata } from 'next';
import Link from 'next/link';

import { Avatar, Estrellas, Etiqueta, Fundador } from '@/components/ui';
import { directorioDeGms } from '@/modules/profiles/queries';

export const metadata: Metadata = {
  title: 'Game masters · TuGameMaster',
  description: 'Quiénes dirigen en TuGameMaster y qué dicen de ellos sus mesas.',
};

export default async function DirectorioGmPage() {
  const gms = await directorioDeGms();

  return (
    <main className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="font-heading text-foreground text-3xl font-extrabold tracking-tight">
        Game masters
      </h1>
      <p className="text-muted-foreground mt-2 max-w-prose">
        Las estrellas y el recuento de partidas salen solo de mesas reservadas y pagadas
        aquí. Nadie puede inflarlos por su cuenta.
      </p>

      {gms.length === 0 ? (
        <p className="border-border text-muted-foreground mt-10 rounded-sm border border-dashed p-8 text-center text-sm">
          Todavía no hay ningún game master con la cuenta lista.
        </p>
      ) : (
        <ul className="mt-8 grid gap-4 sm:grid-cols-2">
          {gms.map((gm) => (
            <li key={gm.id}>
              <Link
                href={`/gm/${gm.user.slug}`}
                className="border-border bg-card hover:border-primary flex h-full gap-4 rounded-sm border p-4 transition hover:-translate-y-0.5"
              >
                <Avatar
                  src={gm.user.image}
                  nombre={gm.user.name}
                  tamano={52}
                  fundador={gm.plan === 'FUNDADOR'}
                />

                <div className="min-w-0 flex-1">
                  <p className="font-heading text-foreground flex flex-wrap items-center gap-2 font-bold">
                    {gm.user.name}
                    {gm.plan === 'FUNDADOR' && <Fundador />}
                  </p>

                  {gm.headline && (
                    <p className="text-muted-foreground mt-0.5 line-clamp-2 text-sm">
                      {gm.headline}
                    </p>
                  )}

                  <div className="mt-2">
                    <Estrellas
                      valor={gm.reputacion.valoracionMedia}
                      total={gm.reputacion.totalResenas}
                    />
                  </div>

                  <p className="text-muted-foreground mt-2 text-xs">
                    {gm.reputacion.partidasDirigidas === 0
                      ? 'Aún no ha dirigido aquí'
                      : `${gm.reputacion.partidasDirigidas} ${
                          gm.reputacion.partidasDirigidas === 1
                            ? 'partida dirigida'
                            : 'partidas dirigidas'
                        }`}
                    {gm._count.games > 0 && (
                      <span className="text-primary">
                        {' · '}
                        {gm._count.games} abierta{gm._count.games === 1 ? '' : 's'}
                      </span>
                    )}
                  </p>

                  {gm.languages.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {gm.languages.map((l) => (
                        <Etiqueta key={l}>{l.toUpperCase()}</Etiqueta>
                      ))}
                    </div>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
