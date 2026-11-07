import { REVISION_TEXTOS_LEGALES } from '@/lib/titular';

/**
 * El molde de las paginas de texto: condiciones, privacidad, aviso legal y
 * contacto. Una columna estrecha, para leer de corrido.
 */
export function PaginaLegal({
  titulo,
  entradilla,
  conFecha = true,
  children,
}: {
  titulo: string;
  entradilla: string;
  conFecha?: boolean;
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="font-heading text-foreground text-3xl font-extrabold">{titulo}</h1>
      <p className="text-muted-foreground mt-2">{entradilla}</p>
      {conFecha && (
        <p className="text-muted-foreground mt-1 text-sm">
          Última revisión:{' '}
          <time dateTime={REVISION_TEXTOS_LEGALES.toISOString().slice(0, 10)}>
            {new Intl.DateTimeFormat('es-ES', { dateStyle: 'long' }).format(
              REVISION_TEXTOS_LEGALES,
            )}
          </time>
        </p>
      )}
      {children}
    </main>
  );
}

export function SeccionLegal({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <section className="text-muted-foreground mt-10 flex flex-col gap-3 leading-relaxed">
      <h2 className="font-heading text-foreground text-xl font-bold">{titulo}</h2>
      {children}
    </section>
  );
}

export function Correo({ direccion }: { direccion: string }) {
  return (
    <a href={`mailto:${direccion}`} className="text-primary hover:underline">
      {direccion}
    </a>
  );
}
