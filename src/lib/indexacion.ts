/**
 * Si los buscadores pueden indexar la web.
 *
 * Por defecto **no**. La web se abre en discreto: funciona y se puede
 * compartir, pero no sale en Google hasta que haya mesas que ensenar. Se abre
 * poniendo `SITIO_INDEXABLE=true` en produccion y volviendo a desplegar (el
 * valor se lee al compilar).
 *
 * Un despliegue de prueba no se indexa nunca, tenga la variable que tenga:
 * duplicaria la web en otro dominio.
 */
export function sitioIndexable(
  entorno: Record<string, string | undefined> = process.env,
): boolean {
  return entorno['VERCEL_ENV'] === 'production' && entorno['SITIO_INDEXABLE'] === 'true';
}
