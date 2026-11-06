-- Codigo de invitacion de los fundadores y emparejamiento al registrarse.
--
-- El emparejamiento vive en el usuario y se fija al crear la cuenta: no
-- depende del navegador desde el que abrio el enlace.
-- AlterTable
ALTER TABLE "GmProfile" ADD COLUMN     "inviteCode" TEXT,
ADD COLUMN     "inviteCodeExpiresAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "referredAt" TIMESTAMP(3),
ADD COLUMN     "referredByGmId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "GmProfile_inviteCode_key" ON "GmProfile"("inviteCode");

-- CreateIndex
CREATE INDEX "User_referredByGmId_idx" ON "User"("referredByGmId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_referredByGmId_fkey" FOREIGN KEY ("referredByGmId") REFERENCES "GmProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

