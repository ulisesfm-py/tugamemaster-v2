/**
 * Resultado de una accion de servidor invocada desde un formulario.
 *
 * Un unico tipo para todas: asi los componentes de formulario se comparten
 * entre modulos sin duplicar botones ni avisos.
 *
 * `null` es el estado inicial, antes de que el usuario envie nada.
 */
export type EstadoAccion = { error: string } | { ok: true; mensaje?: string } | null;
