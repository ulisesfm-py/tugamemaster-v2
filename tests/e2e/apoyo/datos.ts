import { consultar, unaFila } from './db';

/**
 * Datos de prueba para los E2E.
 *
 * Cada prueba se fabrica los suyos con un identificador unico y los borra al
 * terminar. Nada depende de lo que haya dejado otra prueba ni del contenido
 * exacto del seed: lo unico que se da por hecho es que existen los usuarios de
 * desarrollo, que es lo que crea `npm run db:seed`.
 */

/** Contrasena compartida por los usuarios de desarrollo. */
export const PASSWORD = 'partida-secreta';

export const USUARIOS = {
  admin: 'admin@tugamemaster.test',
  gm: 'laura@tugamemaster.test',
  otroGm: 'marco@tugamemaster.test',
  ana: 'ana@tugamemaster.test',
  bruno: 'bruno@tugamemaster.test',
  carla: 'carla@tugamemaster.test',
  dario: 'dario@tugamemaster.test',
} as const;

const HORA = 3_600_000;

/** Identificador tipo cuid, que es lo que usan las tablas. */
function nuevoId(): string {
  return `c${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`;
}

export type OpcionesPartida = {
  /** Cuanto falta para que empiece. Negativo, ya pasada. */
  empiezaEnHoras?: number;
  precioCents?: number;
  plazas?: number;
  estado?: 'DRAFT' | 'PUBLISHED' | 'COMPLETED' | 'CANCELLED';
  /** Email del GM que la dirige. Por defecto, Laura. */
  gm?: string;
};

export type Partida = {
  id: string;
  slug: string;
  title: string;
};

/**
 * Escenario de una prueba: lo que crea, lo borra.
 *
 * Se apunta todo lo que va creando para poder limpiarlo aunque la prueba falle
 * a mitad. Una prueba que deja basura hace fallar a la siguiente por motivos
 * que no tienen nada que ver con lo que estaba probando.
 */
export class Escenario {
  readonly marca = `e2e-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

  private readonly partidas: string[] = [];
  private readonly reservas: string[] = [];

  async usuario(email: string) {
    return unaFila<{ id: string; name: string; slug: string }>(
      'SELECT "id", "name", "slug" FROM "User" WHERE "email" = $1',
      [email],
    );
  }

  async perfilGm(email: string) {
    return unaFila<{ id: string; userId: string }>(
      `SELECT g."id", g."userId"
       FROM "GmProfile" g
       JOIN "User" u ON u."id" = g."userId"
       WHERE u."email" = $1`,
      [email],
    );
  }

  /** Crea una partida con titulo unico, para poder localizarla en pantalla. */
  async crearPartida(titulo: string, opciones: OpcionesPartida = {}): Promise<Partida> {
    const {
      empiezaEnHoras = 72,
      precioCents = 0,
      plazas = 4,
      estado = 'PUBLISHED',
      gm = USUARIOS.gm,
    } = opciones;

    const perfil = await this.perfilGm(gm);
    const inicio = new Date(Date.now() + empiezaEnHoras * HORA);
    const fin = new Date(inicio.getTime() + 4 * HORA);

    const id = nuevoId();
    const tituloCompleto = `${titulo} ${this.marca}`;
    const slug =
      `${this.marca}-${titulo.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`.slice(0, 60);

    await consultar(
      `INSERT INTO "Game"
         ("id", "gmId", "title", "slug", "description", "system",
          "startsAt", "endsAt", "seatsTotal", "priceCents", "currency",
          "status", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'EUR', $11::"GameStatus", now(), now())`,
      [
        id,
        perfil.id,
        tituloCompleto,
        slug,
        'Partida creada por una prueba de extremo a extremo. Se borra al terminar.',
        'D&D 5e',
        inicio,
        fin,
        plazas,
        precioCents,
        estado,
      ],
    );

    this.partidas.push(id);
    return { id, slug, title: tituloCompleto };
  }

  /** Apunta a un jugador a una partida, en el estado que haga falta. */
  async crearReserva(
    gameId: string,
    email: string,
    status: 'PENDING' | 'PAID' | 'COMPLETED' = 'PAID',
    amountCents = 0,
  ): Promise<{ id: string }> {
    const usuario = await this.usuario(email);
    const id = nuevoId();

    await consultar(
      `INSERT INTO "Booking"
         ("id", "gameId", "userId", "status", "amountCents", "currency",
          "creditCents", "isProtected", "paidAt", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4::"BookingStatus", $5, 'EUR', 0, true, $6, now(), now())`,
      [
        id,
        gameId,
        usuario.id,
        status,
        amountCents,
        status === 'PENDING' ? null : new Date(),
      ],
    );

    this.reservas.push(id);
    return { id };
  }

  /** Da una partida por jugada, como haria el cron al cerrarla. */
  async darPorJugada(gameId: string): Promise<void> {
    await consultar(
      `UPDATE "Game"
       SET "status" = 'COMPLETED', "startsAt" = $2, "endsAt" = $3
       WHERE "id" = $1`,
      [gameId, new Date(Date.now() - 6 * HORA), new Date(Date.now() - 2 * HORA)],
    );

    await consultar(
      `UPDATE "Booking" SET "status" = 'COMPLETED' WHERE "gameId" = $1 AND "status" = 'PAID'`,
      [gameId],
    );
  }

  async saldoDe(email: string): Promise<number> {
    const usuario = await this.usuario(email);

    const fila = await unaFila<{ total: string | null }>(
      'SELECT SUM("amountCents")::text AS total FROM "WalletEntry" WHERE "userId" = $1',
      [usuario.id],
    );

    return Number(fila.total ?? 0);
  }

  /** Borra todo lo que ha creado esta prueba, en orden de dependencias. */
  async limpiar(): Promise<void> {
    if (this.partidas.length === 0 && this.reservas.length === 0) return;

    const partidas = this.partidas;

    const deLasPartidas =
      partidas.length > 0
        ? await consultar<{ id: string }>(
            'SELECT "id" FROM "Booking" WHERE "gameId" = ANY($1::text[])',
            [partidas],
          )
        : [];

    const reservas = [...new Set([...this.reservas, ...deLasPartidas.map((b) => b.id)])];

    if (reservas.length > 0) {
      for (const tabla of ['Review', 'Incident', 'WalletEntry', 'PaymentEvent']) {
        await consultar(`DELETE FROM "${tabla}" WHERE "bookingId" = ANY($1::text[])`, [
          reservas,
        ]);
      }
      await consultar('DELETE FROM "PayoutItem" WHERE "bookingId" = ANY($1::text[])', [
        reservas,
      ]);
      await consultar('DELETE FROM "Booking" WHERE "id" = ANY($1::text[])', [reservas]);
    }

    // Red de seguridad: un apunte de monedero sobrevive al borrado de su
    // reserva, porque la clave ajena pone `bookingId` a NULL en vez de
    // borrarlo en cascada. Se barren tambien por la marca, que viaja en el
    // titulo de la partida y de ahi al texto del apunte.
    await consultar('DELETE FROM "WalletEntry" WHERE "note" LIKE $1', [
      `%${this.marca}%`,
    ]);

    if (partidas.length > 0) {
      await consultar('DELETE FROM "Payout" WHERE "gameId" = ANY($1::text[])', [
        partidas,
      ]);
      await consultar('DELETE FROM "SessionNote" WHERE "gameId" = ANY($1::text[])', [
        partidas,
      ]);
      await consultar('DELETE FROM "Game" WHERE "id" = ANY($1::text[])', [partidas]);
    }
  }
}
