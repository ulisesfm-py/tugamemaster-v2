/**
 * Cuentas y comparaciones del panel de metricas.
 *
 * Logica pura: ni base de datos ni reloj (la hora llega por parametro), para
 * comprobarla sin montar nada. Lo que se lee de la base vive en `queries.ts`.
 */

const MS_POR_DIA = 86_400_000;

/** La fecha de hace `dias` dias, a partir de `ahora`. Ventana movil, no por dia natural. */
export function haceDias(ahora: Date, dias: number): Date {
  return new Date(ahora.getTime() - dias * MS_POR_DIA);
}

/**
 * El porcentaje entero de `parte` sobre `total`, o `null` si no hay total.
 *
 * `null` y no 0: «0 % de 0» no es «ninguno», es «aun no hay de que hablar», y
 * un 0 asustaria sin motivo.
 */
export function porcentajeDe(parte: number, total: number): number | null {
  if (total <= 0) return null;
  return Math.round((parte / total) * 100);
}

/** «37 %» o «—» si no hay total. Con espacio, como se escribe en español. */
export function formatearPorcentaje(parte: number, total: number): string {
  const valor = porcentajeDe(parte, total);
  return valor === null ? '—' : `${valor} %`;
}

/**
 * Como va una cifra respecto al periodo anterior, en una frase corta.
 *
 * No calcula un porcentaje de variacion: con cifras tan pequenas («de 1 a 3») un
 * «+200 %» engana, y la diferencia absoluta dice lo mismo sin dramatismo.
 */
export function compararConAnterior(actual: number, anterior: number): string {
  if (actual === anterior) return 'igual que el periodo anterior';
  const diferencia = actual - anterior;
  const signo = diferencia > 0 ? '+' : '−';
  return `${signo}${Math.abs(diferencia)} respecto al periodo anterior`;
}

/** `YYYY-MM-DD` de una fecha en una zona horaria, que es como se agrupa por dia. */
function diaEnZona(fecha: Date, zona: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: zona,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(fecha);
}

export type CuentaDelDia = { dia: string; cantidad: number };

/**
 * Cuantas de estas fechas caen en cada uno de los ultimos `dias` dias naturales
 * (el de hoy incluido), de mas antiguo a mas reciente, con los dias vacios a 0.
 *
 * Los dias se cuentan en `zona` (por defecto Madrid): un registro a las 00:30 de
 * Madrid es del dia siguiente aunque en UTC aun sea el anterior. Los dias se
 * recorren por calendario y no restando 24 h, que se saltaria uno en el cambio
 * de hora.
 */
export function contarPorDia(
  fechas: readonly Date[],
  ahora: Date,
  dias: number,
  zona = 'Europe/Madrid',
): CuentaDelDia[] {
  const [anio, mes, dia] = diaEnZona(ahora, zona).split('-').map(Number) as [
    number,
    number,
    number,
  ];
  const hoy = Date.UTC(anio, mes - 1, dia);

  const cuentas = new Map<string, number>();
  for (let i = dias - 1; i >= 0; i--) {
    cuentas.set(new Date(hoy - i * MS_POR_DIA).toISOString().slice(0, 10), 0);
  }

  for (const fecha of fechas) {
    const clave = diaEnZona(fecha, zona);
    const actual = cuentas.get(clave);
    if (actual !== undefined) cuentas.set(clave, actual + 1);
  }

  return [...cuentas].map(([dia, cantidad]) => ({ dia, cantidad }));
}

/** «16/11» a partir de `YYYY-MM-DD`. */
export function diaCorto(dia: string): string {
  const [, mes, numero] = dia.split('-');
  return `${numero}/${mes}`;
}
