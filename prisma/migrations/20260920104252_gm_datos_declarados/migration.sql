-- AlterTable
ALTER TABLE "GmProfile" ADD COLUMN     "systems" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "yearsExperience" INTEGER;
