import { Button as ButtonPrimitive } from '@base-ui/react/button';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

/**
 * El boton de Brasa.
 *
 * Reescrito sobre el que genera shadcn: se conserva la forma (primitiva de
 * Base UI + cva) para que los componentes que se anadan despues encajen, pero
 * las variantes son las nuestras.
 *
 * La personalidad esta en `solido`: lleva un reborde inferior que lo levanta
 * del fondo y se hunde al pulsarlo. Es el unico boton con relieve de toda la
 * interfaz, y por eso se reserva a la accion principal de cada pantalla. Si
 * hubiera tres, ninguno destacaria.
 */
const variantes = cva(
  'inline-flex shrink-0 items-center justify-center gap-2 rounded-sm font-semibold whitespace-nowrap transition-all outline-none select-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-55 [&_svg]:pointer-events-none [&_svg]:shrink-0',
  {
    variants: {
      variante: {
        solido:
          'bg-primary text-primary-foreground shadow-[0_2px_0_#9c3d16] hover:-translate-y-px hover:shadow-[0_3px_0_#9c3d16] active:translate-y-px active:shadow-[0_1px_0_#9c3d16]',
        perfil:
          'border border-border bg-transparent text-foreground hover:border-muted-foreground hover:bg-secondary',
        fantasma:
          'bg-transparent text-muted-foreground hover:bg-secondary hover:text-foreground',
        peligro:
          'border border-destructive/45 bg-transparent text-destructive hover:bg-destructive hover:text-destructive-foreground',
        enlace: 'text-primary underline-offset-4 hover:underline',
      },
      tamano: {
        sm: 'h-8 px-3 text-sm',
        md: 'h-10 px-4 text-sm',
        lg: 'h-12 px-6 text-base',
        icono: 'size-10',
      },
    },
    defaultVariants: { variante: 'solido', tamano: 'md' },
  },
);

type Props = ButtonPrimitive.Props & VariantProps<typeof variantes>;

function Button({ className, variante, tamano, ...props }: Props) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(variantes({ variante, tamano, className }))}
      {...props}
    />
  );
}

export { Button, variantes as variantesDeBoton };
