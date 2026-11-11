/**
 * La IP de quien hace la peticion, para el limite de intentos.
 *
 * Detras de Vercel la cabecera `x-forwarded-for` la reescribe la plataforma
 * con la IP real del cliente, asi que el primer valor no lo puede falsear
 * quien llama. Si la web se pusiera detras de otro proxy, habria que revisar
 * esto: una cabecera que el cliente puede escribir no sirve para limitar.
 *
 * Devuelve null si no hay cabecera, que solo pasa en desarrollo local. Ahi no
 * se limita por IP: todo el mundo seria "la misma", y una suite de pruebas que
 * entra cincuenta veces se quedaria fuera a la mitad.
 */
export function ipDelCliente(cabeceras: Headers): string | null {
  const reenviada = cabeceras.get('x-forwarded-for')?.split(',')[0]?.trim();
  return reenviada || cabeceras.get('x-real-ip')?.trim() || null;
}
