/**
 * Semillas de desarrollo.
 *
 * Crea un escenario pequeno pero completo: un admin, dos GMs (uno con el alta
 * de Stripe terminada y otro sin ella), jugadores, una campana de dos sesiones
 * con su nota de cierre, partidas sueltas, reservas pagadas, reviews y una
 * entrada de blog.
 *
 * Es idempotente: se apoya en upsert sobre campos unicos, asi que puede
 * ejecutarse las veces que haga falta sin duplicar nada.
 *
 * Todos los usuarios comparten la misma contrasena de desarrollo, definida en
 * PASSWORD_DEV. Solo sirve en local: la base de datos de produccion nunca se
 * siembra.
 */

import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '../src/generated/prisma/client';
import { hashPassword } from '../src/modules/users/password';

const connectionString = process.env['DIRECT_URL'] ?? process.env['DATABASE_URL'];

if (!connectionString) {
  throw new Error('Falta DIRECT_URL o DATABASE_URL; ver docs/environment_setup.md.');
}

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

/** Precio por asiento en centimos. Nunca decimales (ver CLAUDE.md). */
const PRECIO_ASIENTO_CENTS = 1500;

/**
 * Comision de las reservas sembradas, en puntos basicos. Todas son de Laura,
 * que es fundadora y vende al 5% lo que le trae la web.
 */
const COMISION_BPS = 500;

/**
 * Codigo de invitacion de Laura. Fijo, para poder probar el enlace en local
 * (`/r/K7M2QX9A`), y renovado en cada siembra para que nunca este caducado.
 */
const CODIGO_LAURA = {
  inviteCode: 'K7M2QX9A',
  inviteCodeExpiresAt: new Date(Date.now() + 90 * 86_400_000),
};

/** Contrasena compartida por todos los usuarios de prueba. */
const PASSWORD_DEV = 'partida-secreta';

/** Desplaza una fecha en dias respecto de ahora. */
function dias(n: number): Date {
  return new Date(Date.now() + n * 24 * 60 * 60 * 1000);
}

/** Suma horas a una fecha. */
function masHoras(fecha: Date, n: number): Date {
  return new Date(fecha.getTime() + n * 60 * 60 * 1000);
}

async function main() {
  console.log('Sembrando datos de desarrollo...');

  // Un unico hash reutilizado: calcular argon2 nueve veces solo alargaria la
  // siembra sin aportar nada, porque la contrasena es la misma.
  const passwordHash = await hashPassword(PASSWORD_DEV);

  // --- Usuarios -----------------------------------------------------------

  const admin = await db.user.upsert({
    where: { email: 'admin@tugamemaster.test' },
    update: { passwordHash },
    create: {
      email: 'admin@tugamemaster.test',
      name: 'Admin',
      slug: 'admin',
      passwordHash,
      isAdmin: true,
      emailVerified: new Date(),
    },
  });

  const laura = await db.user.upsert({
    where: { email: 'laura@tugamemaster.test' },
    update: { passwordHash },
    create: {
      email: 'laura@tugamemaster.test',
      name: 'Laura Vega',
      slug: 'laura-vega',
      passwordHash,
      bio: 'Dirijo mesas de terror y misterio desde 2016.',
      emailVerified: new Date(),
      preferredSystems: ['Call of Cthulhu', 'Vaesen'],
      preferredStyles: ['narrativo', 'investigacion'],
    },
  });

  const marco = await db.user.upsert({
    where: { email: 'marco@tugamemaster.test' },
    update: { passwordHash },
    create: {
      email: 'marco@tugamemaster.test',
      name: 'Marco Ruiz',
      slug: 'marco-ruiz',
      passwordHash,
      bio: 'Mazmorras clasicas, combate tactico y mucho humor.',
      emailVerified: new Date(),
      preferredSystems: ['D&D 5e'],
      preferredStyles: ['combate', 'exploracion'],
    },
  });

  const jugadores = await Promise.all(
    [
      { email: 'ana@tugamemaster.test', name: 'Ana Soto', slug: 'ana-soto' },
      { email: 'bruno@tugamemaster.test', name: 'Bruno Diaz', slug: 'bruno-diaz' },
      { email: 'carla@tugamemaster.test', name: 'Carla Mena', slug: 'carla-mena' },
      { email: 'dario@tugamemaster.test', name: 'Dario Lopez', slug: 'dario-lopez' },
    ].map((u) =>
      db.user.upsert({
        where: { email: u.email },
        update: { passwordHash },
        create: { ...u, passwordHash, emailVerified: new Date() },
      }),
    ),
  );

  const [ana, bruno, carla, dario] = jugadores;
  if (!ana || !bruno || !carla || !dario) {
    throw new Error('No se pudieron crear los jugadores de prueba');
  }

  // --- Perfiles de GM -----------------------------------------------------

  // Laura tiene el alta de Stripe completada: puede publicar. Es fundadora,
  // para que en local se vean el distintivo y la comision reducida.
  const gmLaura = await db.gmProfile.upsert({
    where: { userId: laura.id },
    // Los datos declarados se refrescan al reseedear, como la ficha de las
    // partidas: son datos de muestra del modelo de hoy.
    update: {
      plan: 'FUNDADOR',
      ...CODIGO_LAURA,
      yearsExperience: 9,
      systems: ['Call of Cthulhu 7e', 'Vaesen', 'Delta Green'],
    },
    create: {
      userId: laura.id,
      headline: 'Terror investigativo en los anos 20',
      about: 'Mesas pausadas, mucha ambientacion y decisiones que pesan.',
      languages: ['es', 'en'],
      plan: 'FUNDADOR',
      ...CODIGO_LAURA,
      yearsExperience: 9,
      systems: ['Call of Cthulhu 7e', 'Vaesen', 'Delta Green'],
      stripeAccountId: 'acct_test_laura',
      chargesEnabled: true,
      payoutsEnabled: true,
      onboardedAt: new Date(),
    },
  });

  // Marco aun no ha terminado el alta: sus partidas no pueden publicarse.
  const gmMarco = await db.gmProfile.upsert({
    where: { userId: marco.id },
    update: {
      yearsExperience: 3,
      systems: ['D&D 5e', 'Shadowdark'],
    },
    create: {
      userId: marco.id,
      headline: 'Mazmorras con mala idea',
      about: 'Combates tacticos y trampas injustas, pero divertidas.',
      languages: ['es'],
      yearsExperience: 3,
      systems: ['D&D 5e', 'Shadowdark'],
    },
  });

  // --- Campana de dos sesiones -------------------------------------------

  const campana = await db.campaign.upsert({
    where: { slug: 'la-sombra-sobre-cadiz' },
    update: {},
    create: {
      gmId: gmLaura.id,
      title: 'La sombra sobre Cadiz',
      slug: 'la-sombra-sobre-cadiz',
      summary:
        'Una investigacion en tres sesiones por los muelles de un Cadiz que ' +
        'esconde algo bajo el agua.',
    },
  });

  const sesion1Inicio = dias(-10);
  const sesion1 = await db.game.upsert({
    where: { slug: 'la-sombra-sobre-cadiz-1' },
    // La ficha se refresca al reseedear: son datos de muestra y tienen que
    // reflejar el modelo de hoy, no el del dia en que se creo la fila.
    update: {
      languages: ['es'],
      experience: 'ALGUNA',
      tags: ['investigacion', 'terror', 'interpretacion'],
      minAge: 16,
    },
    create: {
      gmId: gmLaura.id,
      campaignId: campana.id,
      title: 'La sombra sobre Cadiz - Sesion 1',
      slug: 'la-sombra-sobre-cadiz-1',
      description: 'Los investigadores llegan al puerto siguiendo una carta.',
      system: 'Call of Cthulhu 7e',
      languages: ['es'],
      experience: 'ALGUNA',
      tags: ['investigacion', 'terror', 'interpretacion'],
      minAge: 16,
      startsAt: sesion1Inicio,
      endsAt: masHoras(sesion1Inicio, 4),
      seatsTotal: 4,
      priceCents: PRECIO_ASIENTO_CENTS,
      status: 'COMPLETED',
      sessionNumber: 1,
    },
  });

  // Nota de cierre: la plantilla con la que se crea la siguiente sesion.
  await db.sessionNote.upsert({
    where: { gameId: sesion1.id },
    update: {},
    create: {
      gameId: sesion1.id,
      content: [
        'Terminamos en el almacen 7 del muelle, de noche.',
        'Ana (Dra. Soler): 3/5 de cordura perdida, herida leve.',
        'Bruno (Inspector Paz): intacto, lleva el diario robado.',
        'Pendiente: abrir el diario y localizar al capitan Arrieta.',
      ].join('\n'),
    },
  });

  // Sesion 2: solo para quienes jugaron la 1. La restriccion la aplicara la
  // capa de dominio en la fase 9; aqui queda el enlace previousGameId.
  const sesion2Inicio = dias(5);
  await db.game.upsert({
    where: { slug: 'la-sombra-sobre-cadiz-2' },
    // La ficha se refresca al reseedear: son datos de muestra y tienen que
    // reflejar el modelo de hoy, no el del dia en que se creo la fila.
    update: {
      languages: ['es'],
      experience: 'ALGUNA',
      tags: ['investigacion', 'terror', 'interpretacion'],
      minAge: 16,
    },
    create: {
      gmId: gmLaura.id,
      campaignId: campana.id,
      title: 'La sombra sobre Cadiz - Sesion 2',
      slug: 'la-sombra-sobre-cadiz-2',
      description: 'El diario revela un nombre. Alguien mas lo esta buscando.',
      system: 'Call of Cthulhu 7e',
      languages: ['es'],
      experience: 'ALGUNA',
      tags: ['investigacion', 'terror', 'interpretacion'],
      minAge: 16,
      startsAt: sesion2Inicio,
      endsAt: masHoras(sesion2Inicio, 4),
      seatsTotal: 4,
      priceCents: PRECIO_ASIENTO_CENTS,
      status: 'PUBLISHED',
      sessionNumber: 2,
      previousGameId: sesion1.id,
    },
  });

  // --- Partidas sueltas ---------------------------------------------------

  const oneshotInicio = dias(12);
  const oneshot = await db.game.upsert({
    where: { slug: 'el-faro-de-finisterre' },
    // La ficha se refresca al reseedear: son datos de muestra y tienen que
    // reflejar el modelo de hoy, no el del dia en que se creo la fila.
    update: {
      languages: ['es', 'en'],
      experience: 'ABIERTA',
      tags: ['misterio', 'investigacion'],
    },
    create: {
      gmId: gmLaura.id,
      title: 'El faro de Finisterre',
      slug: 'el-faro-de-finisterre',
      description: 'One-shot de terror costero para una tarde.',
      system: 'Vaesen',
      languages: ['es', 'en'],
      experience: 'ABIERTA',
      tags: ['misterio', 'investigacion'],
      startsAt: oneshotInicio,
      endsAt: masHoras(oneshotInicio, 3),
      seatsTotal: 5,
      priceCents: 2000,
      status: 'PUBLISHED',
    },
  });

  // Partida de Marco: en borrador, porque no tiene el alta de Stripe hecha.
  const borradorInicio = dias(20);
  await db.game.upsert({
    where: { slug: 'la-cripta-de-los-mil-dientes' },
    // La ficha se refresca al reseedear: son datos de muestra y tienen que
    // reflejar el modelo de hoy, no el del dia en que se creo la fila.
    update: {
      languages: ['es'],
      experience: 'VETERANA',
      tags: ['combate', 'exploracion', 'fantasia-oscura'],
    },
    create: {
      gmId: gmMarco.id,
      title: 'La cripta de los mil dientes',
      slug: 'la-cripta-de-los-mil-dientes',
      description: 'Mazmorra clasica, nivel 3, sin piedad.',
      system: 'D&D 5e',
      languages: ['es'],
      experience: 'VETERANA',
      tags: ['combate', 'exploracion', 'fantasia-oscura'],
      startsAt: borradorInicio,
      endsAt: masHoras(borradorInicio, 4),
      seatsTotal: 6,
      priceCents: 1200,
      status: 'DRAFT',
    },
  });

  // --- Reservas -----------------------------------------------------------

  /**
   * Crea una reserva pagada con el desglose de dinero ya calculado.
   * stripeFee simula el coste real que Stripe reportaria en la
   * balance_transaction; en produccion se lee de Stripe, nunca se estima.
   */
  async function reservaPagada(gameId: string, userId: string, precioCents: number) {
    const comision = Math.round((precioCents * COMISION_BPS) / 10_000);
    const stripeFee = Math.round(precioCents * 0.015) + 25;

    return db.booking.upsert({
      where: { gameId_userId: { gameId, userId } },
      update: {},
      create: {
        gameId,
        userId,
        status: 'COMPLETED',
        amountCents: precioCents,
        commissionBps: COMISION_BPS,
        commissionCents: comision,
        stripeFeeCents: stripeFee,
        payoutCents: precioCents - comision - stripeFee,
        paidAt: dias(-11),
      },
    });
  }

  const reservaAna = await reservaPagada(sesion1.id, ana.id, PRECIO_ASIENTO_CENTS);
  const reservaBruno = await reservaPagada(sesion1.id, bruno.id, PRECIO_ASIENTO_CENTS);

  // Reserva futura y aun sin cobrar sobre la partida suelta.
  await db.booking.upsert({
    where: { gameId_userId: { gameId: oneshot.id, userId: carla.id } },
    update: {},
    create: {
      gameId: oneshot.id,
      userId: carla.id,
      status: 'PAID',
      amountCents: 2000,
      commissionBps: COMISION_BPS,
      commissionCents: 100,
      stripeFeeCents: 55,
      payoutCents: 1845,
      paidAt: new Date(),
    },
  });

  // --- Pago al GM ---------------------------------------------------------
  //
  // Lo que habria dejado el cron 48 h despues de jugarse la sesion 1. Sin esto
  // el panel de ingresos sale en blanco en local y no hay forma de ver como se
  // comporta con dinero ya transferido.

  const totalPagado = (reservaAna.payoutCents ?? 0) + (reservaBruno.payoutCents ?? 0);

  await db.payout.upsert({
    where: { gameId: sesion1.id },
    update: {},
    create: {
      gmId: gmLaura.id,
      gameId: sesion1.id,
      amountCents: totalPagado,
      status: 'PAID',
      stripeTransferId: 'tr_test_sesion1',
      scheduledFor: dias(-8),
      paidAt: dias(-8),
      items: {
        create: [
          { bookingId: reservaAna.id, amountCents: reservaAna.payoutCents ?? 0 },
          { bookingId: reservaBruno.id, amountCents: reservaBruno.payoutCents ?? 0 },
        ],
      },
    },
  });

  // --- Reviews ------------------------------------------------------------

  await db.review.upsert({
    where: { bookingId: reservaAna.id },
    update: {},
    create: {
      bookingId: reservaAna.id,
      gameId: sesion1.id,
      authorId: ana.id,
      gmId: gmLaura.id,
      rating: 5,
      comment: 'Ambientacion impecable y muy buen ritmo. Repetire.',
    },
  });

  await db.review.upsert({
    where: { bookingId: reservaBruno.id },
    update: {},
    create: {
      bookingId: reservaBruno.id,
      gameId: sesion1.id,
      authorId: bruno.id,
      gmId: gmLaura.id,
      rating: 4,
      comment: 'Muy bien llevada, aunque se nos hizo corta.',
    },
  });

  // --- Blog ---------------------------------------------------------------

  await db.post.upsert({
    where: { slug: 'como-preparar-tu-primera-partida-de-pago' },
    update: {},
    create: {
      authorId: admin.id,
      title: 'Como preparar tu primera partida de pago',
      slug: 'como-preparar-tu-primera-partida-de-pago',
      excerpt: 'Que esperan los jugadores cuando pagan por sentarse a tu mesa.',
      content:
        'Cobrar por dirigir cambia las expectativas. Esta guia recorre la ' +
        'preparacion, la comunicacion previa y que hacer cuando algo sale mal.',
      status: 'PUBLISHED',
      publishedAt: dias(-3),
    },
  });

  // --- Resumen ------------------------------------------------------------

  const conteos = {
    usuarios: await db.user.count(),
    gms: await db.gmProfile.count(),
    campanas: await db.campaign.count(),
    partidas: await db.game.count(),
    reservas: await db.booking.count(),
    reviews: await db.review.count(),
    posts: await db.post.count(),
  };

  console.log('Listo:', conteos);
  console.log(`Contrasena de todos los usuarios de prueba: ${PASSWORD_DEV}`);
}

main()
  .catch((e: unknown) => {
    console.error('Fallo la siembra:', e);
    process.exit(1);
  })
  .finally(() => {
    void db.$disconnect();
  });
