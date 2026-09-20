import Link from 'next/link';

/**
 * Entrar y registrarse van sin cabecera ni pie.
 *
 * Son las dos unicas pantallas de la web con una sola tarea, y cada enlace de
 * mas es una puerta por la que irse a mitad. Lo que si hace falta es una
 * manera de volver: el nombre de arriba lleva a la portada, que antes solo se
 * alcanzaba con el boton de atras del navegador.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-8 px-4 py-12">
      <Link
        href="/"
        className="font-heading text-foreground hover:text-primary focus-visible:ring-ring rounded-sm text-xl font-extrabold tracking-tight transition focus-visible:ring-2 focus-visible:outline-none"
      >
        TuGameMaster
      </Link>

      <main className="w-full max-w-sm">{children}</main>
    </div>
  );
}
