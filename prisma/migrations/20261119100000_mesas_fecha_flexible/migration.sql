-- Mesas con fecha flexible: una mesa sin fecha que junta pre-reservas
-- gratuitas hasta que el GM la convoca. Solo crea tablas y tipos nuevos: no
-- toca ninguna existente, asi que el codigo anterior sigue funcionando.
◇ injected env (16) from .env.local // tip: ⌘ override existing { override: true }
◇ injected env (0) from .env // tip: ⌘ enable debugging { debug: true }
-- CreateEnum
CREATE TYPE "EstadoConvocatoria" AS ENUM ('BORRADOR', 'ABIERTA', 'CONVOCADA', 'CERRADA');

-- CreateEnum
CREATE TYPE "FrecuenciaConvocatoria" AS ENUM ('UNICA', 'SEMANAL', 'QUINCENAL');

-- CreateTable
CREATE TABLE "Convocatoria" (
    "id" TEXT NOT NULL,
    "gmId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "system" TEXT NOT NULL,
    "imageUrl" TEXT,
    "languages" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "experience" "GameExperience" NOT NULL DEFAULT 'ABIERTA',
    "minAge" INTEGER,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "seatsTotal" INTEGER NOT NULL,
    "minPlayers" INTEGER NOT NULL,
    "priceCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "weekdays" INTEGER[],
    "startMinute" INTEGER NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "frequency" "FrecuenciaConvocatoria" NOT NULL DEFAULT 'UNICA',
    "status" "EstadoConvocatoria" NOT NULL DEFAULT 'BORRADOR',
    "gameId" TEXT,
    "priorityUntil" TIMESTAMP(3),
    "minReachedNoticeAt" TIMESTAMP(3),
    "convenedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Convocatoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PreReserva" (
    "id" TEXT NOT NULL,
    "convocatoriaId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PreReserva_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Convocatoria_slug_key" ON "Convocatoria"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Convocatoria_gameId_key" ON "Convocatoria"("gameId");

-- CreateIndex
CREATE INDEX "Convocatoria_status_createdAt_idx" ON "Convocatoria"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Convocatoria_gmId_idx" ON "Convocatoria"("gmId");

-- CreateIndex
CREATE INDEX "PreReserva_userId_idx" ON "PreReserva"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PreReserva_convocatoriaId_userId_key" ON "PreReserva"("convocatoriaId", "userId");

-- AddForeignKey
ALTER TABLE "Convocatoria" ADD CONSTRAINT "Convocatoria_gmId_fkey" FOREIGN KEY ("gmId") REFERENCES "GmProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Convocatoria" ADD CONSTRAINT "Convocatoria_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PreReserva" ADD CONSTRAINT "PreReserva_convocatoriaId_fkey" FOREIGN KEY ("convocatoriaId") REFERENCES "Convocatoria"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PreReserva" ADD CONSTRAINT "PreReserva_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

