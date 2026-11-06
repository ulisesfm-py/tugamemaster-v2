-- Partidas privadas: visibles en el listado, reservables con contrasena.
-- CreateEnum
CREATE TYPE "VisibilidadPartida" AS ENUM ('PUBLICA', 'PRIVADA');

-- AlterTable
ALTER TABLE "Game" ADD COLUMN     "accessPassword" TEXT,
ADD COLUMN     "visibility" "VisibilidadPartida" NOT NULL DEFAULT 'PUBLICA';

