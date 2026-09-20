import type { Metadata } from 'next';
import { Barlow, Bricolage_Grotesque } from 'next/font/google';
import './globals.css';

/**
 * Brasa usa dos familias y solo dos.
 *
 * Bricolage Grotesque para titulos: tiene caracter y aguanta el tamano
 * grande. Barlow para todo lo demas: ligeramente estrecha, asi que cabe mas
 * en una tarjeta sin apretar.
 */
const barlow = Barlow({
  variable: '--font-barlow',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

const bricolage = Bricolage_Grotesque({
  variable: '--font-bricolage',
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'TuGameMaster',
    template: '%s',
  },
  description:
    'Reserva tu sitio en partidas de rol dirigidas por game masters, o abre tu propia mesa y cobra por dirigirla.',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    // `dark` va fijo: el tema es unico y oscuro (ver docs/diseno.md). Ademas
    // hace que las clases `dark:` que quedan de antes resuelvan por el lado
    // correcto mientras se migran pagina a pagina a los tokens de Brasa.
    <html
      lang="es"
      className={`dark ${barlow.variable} ${bricolage.variable} h-full antialiased`}
    >
      {/* `suppressHydrationWarning` es por las extensiones del navegador, no
          por nosotros: Grammarly y compania inyectan atributos en <body>
          (`data-gr-ext-installed`, `data-new-gr-c-s-check-loaded`) antes de
          que React hidrate, y eso levanta un aviso de discrepancia que no
          tiene arreglo desde aqui. Solo silencia los atributos de esta
          etiqueta, un nivel: cualquier discrepancia de verdad dentro de la
          pagina sigue avisando. */}
      <body
        suppressHydrationWarning
        className="bg-background text-foreground flex min-h-full flex-col"
      >
        {children}
      </body>
    </html>
  );
}
