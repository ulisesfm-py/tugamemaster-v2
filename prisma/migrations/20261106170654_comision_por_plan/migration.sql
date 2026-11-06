-- Comision por plan del GM y por origen del jugador.
--
-- La comision deja de ser una constante y pasa a guardarse en cada reserva al
-- reservar. Las reservas que ya existen se vendieron al 5%, y con eso se
-- quedan: una comision no se recalcula nunca a partir de la politica vigente.

-- CreateEnum
CREATE TYPE "PlanGm" AS ENUM ('ESTANDAR', 'FUNDADOR');

-- CreateEnum
CREATE TYPE "OrigenReserva" AS ENUM ('PLATAFORMA', 'ENLACE_GM');

-- AlterTable
ALTER TABLE "GmProfile" ADD COLUMN "plan" "PlanGm" NOT NULL DEFAULT 'ESTANDAR';

-- AlterTable: primero admite nulos, se rellena con el 5% de entonces y solo
-- despues se exige. Sin valor por defecto a proposito: una reserva nueva que
-- no diga su comision es un error del codigo, no un 5% silencioso.
ALTER TABLE "Booking" ADD COLUMN "commissionBps" INTEGER,
ADD COLUMN "origin" "OrigenReserva" NOT NULL DEFAULT 'PLATAFORMA';

UPDATE "Booking" SET "commissionBps" = 500;

ALTER TABLE "Booking" ALTER COLUMN "commissionBps" SET NOT NULL;

ALTER TABLE "Booking" ADD CONSTRAINT "Booking_commissionBps_check"
  CHECK ("commissionBps" BETWEEN 0 AND 10000);
