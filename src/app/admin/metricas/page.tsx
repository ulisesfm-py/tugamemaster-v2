import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { Estado } from '@/components/ui';
import { exigirAdmin } from '@/lib/auth/admin';
import { PLAZAS_DE_FUNDADOR } from '@/modules/invitaciones/politica';
import {
  compararConAnterior,
  diaCorto,
  formatearPorcentaje,
} from '@/modules/metricas/politica';
import { metricasDeLaWeb } from '@/modules/metricas/queries';
import { formatearImporte } from '@/modules/payments/dinero';

export const metadata: Metadata = { title: 'Métricas · Admin' };

/**
 * Como va la web, con los numeros que ya guarda la base de datos.
 *
 * Responde a «¿esto avanza?», no a «¿cuanta gente mira?»: las visitas y de donde
 * llegan estan en Vercel (Analytics). Aqui se cuenta lo que pasa dentro: quien
 * se registra, cuantos game masters llegan a cobrar y que parte de los pagos que
 * se empiezan se terminan.
 */

const FECHA_HORA = new Intl.DateTimeFormat('es-ES', {
  dateStyle: 'long',
  timeStyle: 'short',
  timeZone: 'Europe/Madrid',
});

function Seccion({
  titulo,
  descripcion,
  children,
}: {
  titulo: string;
  descripcion?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-border bg-card mt-8 rounded-sm border p-5">
      <h2 className="font-heading text-foreground text-base font-bold">{titulo}</h2>
      {descripcion ? (
        <p className="text-muted-foreground mt-1 text-sm">{descripcion}</p>
      ) : null}
      {children}
    </section>
  );
}

function Cifras({ children }: { children: React.ReactNode }) {
  return (
    <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-3">{children}</dl>
  );
}

function Cifra({
  etiqueta,
  valor,
  nota,
}: {
  etiqueta: string;
  valor: React.ReactNode;
  nota?: string;
}) {
  return (
    <div className="flex flex-col">
      <dt className="text-muted-foreground order-2 mt-0.5 text-xs font-semibold tracking-widest uppercase">
        {etiqueta}
      </dt>
      <dd className="font-heading text-foreground order-1 text-2xl font-extrabold tabular-nums">
        {valor}
      </dd>
      {nota ? (
        <dd className="text-muted-foreground order-3 mt-1 text-xs">{nota}</dd>
      ) : null}
    </div>
  );
}

export default async function MetricasPage() {
  // El middleware ya bloquea /admin, pero se repite aqui: la seguridad no
  // puede depender de una sola capa.
  if (!(await exigirAdmin())) notFound();

  const m = await metricasDeLaWeb();
  const { usuarios, gms, partidas, reservas, dinero, actividad } = m;

  const maximoDelDia = Math.max(1, ...usuarios.porDia.map((d) => d.cantidad));
  const plazasLibres = partidas.plazasTotales - partidas.plazasOcupadas;

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <Link href="/admin" className="text-muted-foreground text-sm hover:underline">
        ← Administración
      </Link>

      <h1 className="font-heading text-foreground mt-4 text-3xl font-extrabold sm:text-4xl">
        Métricas
      </h1>
      <p className="text-muted-foreground mt-2">
        Lo que pasa dentro de la web, a {FECHA_HORA.format(m.generadoEl)}. Las visitas y
        de dónde llegan están en Vercel → Analytics.
      </p>
      <p className="text-muted-foreground mt-2 text-sm">
        Las cifras{' '}
        <strong className="text-foreground">
          incluyen las cuentas y reservas de prueba
        </strong>
        : la base de datos no las distingue.
      </p>

      <Seccion
        titulo="Game masters"
        descripcion="El camino de cada uno hasta cobrar. Donde se quede la mayoría es donde hay que ayudar."
      >
        <Cifras>
          <Cifra etiqueta="Con perfil" valor={gms.perfiles} />
          <Cifra
            etiqueta="Con cobros activados"
            valor={gms.cobrosActivados}
            nota={`${formatearPorcentaje(gms.cobrosActivados, gms.perfiles)} de los que tienen perfil`}
          />
          <Cifra
            etiqueta="Con partida publicada"
            valor={gms.conPartida}
            nota={`${formatearPorcentaje(gms.conPartida, gms.cobrosActivados)} de los que pueden cobrar`}
          />
          <Cifra
            etiqueta="Con una reserva pagada"
            valor={gms.conReservaPagada}
            nota={`${formatearPorcentaje(gms.conReservaPagada, gms.conPartida)} de los que publicaron`}
          />
          <Cifra
            etiqueta="Fundadores"
            valor={`${m.fundadores.length} / ${PLAZAS_DE_FUNDADOR}`}
          />
        </Cifras>

        {m.fundadores.length > 0 ? (
          <div className="mt-6 overflow-x-auto">
            <table className="border-border w-full border-y text-left text-sm">
              <caption className="sr-only">Fundadores y su código</caption>
              <thead>
                <tr className="text-muted-foreground text-xs tracking-widest uppercase">
                  <th scope="col" className="py-2 pr-4 font-semibold">
                    Fundador
                  </th>
                  <th scope="col" className="py-2 pr-4 text-right font-semibold">
                    Registrados con su código
                  </th>
                  <th scope="col" className="py-2 pr-4 text-right font-semibold">
                    Partidas
                  </th>
                  <th scope="col" className="py-2 text-right font-semibold">
                    Código
                  </th>
                </tr>
              </thead>
              <tbody className="divide-border divide-y">
                {m.fundadores.map((f) => (
                  <tr key={f.slug}>
                    <th scope="row" className="text-foreground py-3 pr-4 font-normal">
                      <Link href={`/gm/${f.slug}`} className="hover:underline">
                        {f.nombre}
                      </Link>
                      {!f.cobrosActivados ? (
                        <span className="text-muted-foreground ml-2 text-xs">
                          sin cobros
                        </span>
                      ) : null}
                    </th>
                    <td className="py-3 pr-4 text-right tabular-nums">{f.invitados}</td>
                    <td className="py-3 pr-4 text-right tabular-nums">{f.partidas}</td>
                    <td className="py-3 text-right">
                      <Estado tono={f.codigo === 'VIGENTE' ? 'bien' : 'apagado'}>
                        {f.codigo === 'VIGENTE' ? 'vigente' : 'caducado'}
                      </Estado>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </Seccion>

      <Seccion
        titulo="Cuentas"
        descripcion={`Los últimos ${m.diasDelPeriodo} días frente a los ${m.diasDelPeriodo} anteriores.`}
      >
        <Cifras>
          <Cifra etiqueta="Cuentas" valor={usuarios.total} />
          <Cifra
            etiqueta={`Nuevas en ${m.diasDelPeriodo} días`}
            valor={usuarios.nuevos}
            nota={compararConAnterior(usuarios.nuevos, usuarios.nuevosAnteriores)}
          />
          <Cifra
            etiqueta="Con código de invitación"
            valor={usuarios.conCodigo}
            nota={`${formatearPorcentaje(usuarios.conCodigo, usuarios.total)} de las cuentas`}
          />
          <Cifra etiqueta="Con Discord" valor={usuarios.conDiscord} />
          <Cifra
            etiqueta="Jugadores con reserva pagada"
            valor={usuarios.jugadoresConReservaPagada}
            nota={`${formatearPorcentaje(usuarios.jugadoresConReservaPagada, usuarios.total)} de las cuentas`}
          />
        </Cifras>

        <h3 className="text-muted-foreground mt-6 text-xs font-semibold tracking-widest uppercase">
          Cuentas nuevas por día
        </h3>
        <ol className="mt-3 flex flex-col gap-1.5" aria-label="Cuentas nuevas por día">
          {usuarios.porDia.map((d) => (
            <li key={d.dia} className="flex items-center gap-3 text-sm">
              <span className="text-muted-foreground w-12 shrink-0 tabular-nums">
                {diaCorto(d.dia)}
              </span>
              <span className="bg-muted h-3 flex-1 overflow-hidden rounded-sm">
                <span
                  className="bg-primary block h-full"
                  style={{ width: `${(d.cantidad / maximoDelDia) * 100}%` }}
                />
              </span>
              <span className="text-foreground w-6 text-right tabular-nums">
                {d.cantidad}
              </span>
            </li>
          ))}
        </ol>
      </Seccion>

      <Seccion
        titulo="Partidas"
        descripcion="Las que están abiertas ahora: publicadas y con la fecha por llegar."
      >
        <Cifras>
          <Cifra
            etiqueta="Publicadas"
            valor={partidas.publicadas}
            nota={`${partidas.privadas} ${partidas.privadas === 1 ? 'privada' : 'privadas'}`}
          />
          <Cifra
            etiqueta="Plazas ocupadas"
            valor={`${partidas.plazasOcupadas} / ${partidas.plazasTotales}`}
            nota={`${formatearPorcentaje(partidas.plazasOcupadas, partidas.plazasTotales)} de ocupación, ${plazasLibres} libres`}
          />
          <Cifra etiqueta="Jugadas" valor={partidas.jugadas} />
        </Cifras>
      </Seccion>

      <Seccion
        titulo="Reservas de pago"
        descripcion="Cuántas de las personas que empiezan a pagar terminan. Las gratuitas no cuentan aquí."
      >
        <Cifras>
          <Cifra etiqueta="Iniciadas" valor={reservas.iniciadas} />
          <Cifra
            etiqueta="Pagadas alguna vez"
            valor={reservas.pagadasAlgunaVez}
            nota={`${formatearPorcentaje(reservas.pagadasAlgunaVez, reservas.iniciadas)} de las iniciadas`}
          />
          <Cifra
            etiqueta="Abandonadas"
            valor={reservas.abandonadas}
            nota="Empezaron a pagar y no terminaron"
          />
          <Cifra etiqueta="Pago fallido" valor={reservas.fallidas} />
          <Cifra
            etiqueta="Devueltas"
            valor={reservas.devueltas}
            nota="Canceladas o reembolsadas"
          />
          <Cifra
            etiqueta="Gratuitas con plaza"
            valor={reservas.gratuitas}
            nota="Casi seguro, pruebas"
          />
        </Cifras>
      </Seccion>

      <Seccion
        titulo="Dinero"
        descripcion="De las reservas de pago que siguen en pie. La comisión es el margen bruto: el coste de Stripe se descuenta a cada game master."
      >
        <Cifras>
          <Cifra etiqueta="Plazas vendidas" valor={dinero.plazasVendidas} />
          <Cifra etiqueta="Vendido" valor={formatearImporte(dinero.vendido)} />
          <Cifra
            etiqueta="Comisión"
            valor={formatearImporte(dinero.comision)}
            nota="Lo que se queda la plataforma"
          />
          <Cifra
            etiqueta="Coste de Stripe"
            valor={formatearImporte(dinero.costeDeStripe)}
            nota="Se descuenta al game master"
          />
          <Cifra
            etiqueta="Pagado a game masters"
            valor={formatearImporte(dinero.pagadoAGms)}
          />
          <Cifra
            etiqueta="Pendiente de pagarles"
            valor={formatearImporte(dinero.pendienteDePagarAGms)}
            nota="En espera, bloqueado o fallido"
          />
        </Cifras>
      </Seccion>

      <Seccion titulo="Confianza">
        <Cifras>
          <Cifra etiqueta="Reseñas" valor={actividad.resenas} />
          <Cifra
            etiqueta="Incidencias abiertas"
            valor={actividad.incidenciasAbiertas}
            nota="Cada una detiene un pago"
          />
          <Cifra etiqueta="Artículos publicados" valor={actividad.entradasPublicadas} />
        </Cifras>
      </Seccion>
    </main>
  );
}
